import { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/client.js';
import { workspaceMembers, workspaces } from '../db/schema.js';
import { AppError } from '../lib/errors.js';
import { hasPermission, type Role } from '@leadpilot/shared';

declare global {
  namespace Express {
    interface Request {
      workspaceId: string;
      userRole: Role;
    }
  }
}

/**
 * Resolves workspace from :workspaceId param (or x-workspace-id header)
 * and verifies the authenticated user is a member.
 * Sets req.workspaceId and req.userRole.
 */
export async function requireWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = req.params['workspaceId'] ?? req.headers['x-workspace-id'] as string;

  if (!workspaceId) {
    throw AppError.forbidden('Workspace ID is required.');
  }

  const db = getDb();
  const userId = req.session.userId!;

  const [member] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
        // Exclude soft-deleted workspaces
      ),
    )
    .limit(1);

  if (!member) {
    // Use 404 not 403 to avoid workspace existence enumeration
    throw AppError.notFound('Workspace');
  }

  req.workspaceId = workspaceId;
  req.userRole = member.role as Role;
  next();
}

/**
 * Factory for permission-based authorization middleware.
 * Must be used after requireAuth and requireWorkspace.
 */
export function requirePermission(permission: string) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const role = _req.userRole;
    if (!hasPermission(role, permission)) {
      throw AppError.forbidden();
    }
    next();
  };
}
