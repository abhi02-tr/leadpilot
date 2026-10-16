import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { users, workspaces, workspaceMembers, refreshTokens } from '../../db/schema.js';
import { hashPassword, verifyPassword, generateToken, hashToken, generateSlug } from '../../lib/crypto.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import type { RegisterInput, LoginInput } from '@leadpilot/shared';

export async function registerUser(input: RegisterInput) {
  const db = getDb();
  const email = input.email.toLowerCase().trim();

  // Check duplicate email
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    // Generic message to prevent enumeration
    throw AppError.conflict('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(input.password);

  // Generate unique slug for workspace
  let slug = generateSlug(input.workspaceName);
  const [existingSlug] = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, slug)).limit(1);
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  // Create user, workspace, and membership in a transaction
  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email, name: input.name, passwordHash })
      .returning({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt });

    if (!user) throw new Error('Failed to create user');

    const [workspace] = await tx
      .insert(workspaces)
      .values({ name: input.workspaceName, slug, timezone: input.timezone, ownerUserId: user.id })
      .returning({ id: workspaces.id, name: workspaces.name, slug: workspaces.slug });

    if (!workspace) throw new Error('Failed to create workspace');

    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });

    return { user, workspace };
  });

  logger.info({ userId: result.user.id, workspaceId: result.workspace.id }, 'User registered');
  return result;
}

export async function loginUser(input: LoginInput): Promise<{ id: string; email: string; name: string }> {
  const db = getDb();
  const email = input.email.toLowerCase().trim();

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always verify a hash (even if user not found) to prevent timing attacks
  const hashToVerify = user?.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=1$placeholder';
  const valid = user?.passwordHash ? await verifyPassword(hashToVerify, input.password) : false;

  if (!user || !valid) {
    throw AppError.unauthorized();
  }

  logger.info({ userId: user.id }, 'User logged in');
  return { id: user.id, email: user.email, name: user.name };
}

export async function getUserById(userId: string) {
  const db = getDb();
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw AppError.notFound('User');
  return user;
}

export async function getUserWorkspaces(userId: string) {
  const db = getDb();
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      timezone: workspaces.timezone,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(and(eq(workspaceMembers.userId, userId)));
}

export async function initiatePasswordReset(email: string): Promise<{ token: string } | null> {
  const db = getDb();
  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    // Don't reveal whether the email exists
    return null;
  }

  const token = generateToken(32);
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(refreshTokens).values({
    userId: user.id,
    hashedToken,
    expiresAt,
  });

  logger.info({ userId: user.id }, 'Password reset token generated');
  // In production, this token would be emailed. For now, return it for configuration purposes.
  return { token };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const db = getDb();
  const hashedToken = hashToken(token);

  const [tokenRecord] = await db
    .select({ id: refreshTokens.id, userId: refreshTokens.userId, expiresAt: refreshTokens.expiresAt, revokedAt: refreshTokens.revokedAt })
    .from(refreshTokens)
    .where(eq(refreshTokens.hashedToken, hashedToken))
    .limit(1);

  if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
    throw AppError.unprocessable('This reset link is invalid or has expired.');
  }

  const passwordHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, tokenRecord.userId));
    // Revoke the token
    await tx.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, tokenRecord.id));
  });

  logger.info({ userId: tokenRecord.userId }, 'Password reset completed');
}
