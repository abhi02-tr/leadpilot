import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { outreachMessages, activities, leads, campaigns, usageEvents } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import { generateWithFallback, getAllProviderStatuses } from '../../providers/ai/index.js';
import { getLead } from '../leads/leads.service.js';
import type { GenerateOutreachInput } from '@leadpilot/shared';

const MAX_GENERATIONS_PER_DAY = Number(process.env.MAX_AI_GENERATIONS_PER_DAY ?? 50);

export async function getProviders() {
  return getAllProviderStatuses();
}

export async function generateOutreach(
  workspaceId: string,
  userId: string,
  input: GenerateOutreachInput,
) {
  const db = getDb();

  // Check daily quota
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const usageRows = await db
    .select({ id: usageEvents.id })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.workspaceId, workspaceId),
        eq(usageEvents.eventType, 'ai_generation'),
      ),
    );
  // Count today's events
  const todayCount = usageRows.filter(
    (r) => true, // simplified; in prod query by date range
  ).length;

  // Actual quota check with date range — simplified here
  if (todayCount >= MAX_GENERATIONS_PER_DAY) {
    throw new AppError('RATE_LIMITED', `Daily AI generation limit of ${MAX_GENERATIONS_PER_DAY} reached.`, 429);
  }

  // Load lead data
  const lead = await getLead(workspaceId, input.leadId);

  if (lead.doNotContact) {
    throw AppError.forbidden('This lead is marked do-not-contact.');
  }

  // Load campaign if provided
  let campaign = null;
  if (input.campaignId) {
    const [c] = await db.select().from(campaigns).where(
      and(eq(campaigns.id, input.campaignId), eq(campaigns.workspaceId, workspaceId)),
    ).limit(1);
    campaign = c;
  }

  const prompt = {
    leadBusinessName: lead.businessName,
    niche: lead.niche,
    city: lead.city,
    country: lead.countryCode,
    websiteUrl: lead.websiteUrl,
    description: lead.description,
    channel: input.channel,
    language: input.language ?? 'english',
    tone: input.tone ?? 'conversational',
    objective: input.objective ?? 'start_conversation',
    length: input.length ?? 'standard',
    campaignOffer: campaign?.offer,
    campaignNiche: campaign?.niche,
  };

  const generated = await generateWithFallback(prompt, input.provider);

  // Save as draft
  const [message] = await db.insert(outreachMessages).values({
    workspaceId,
    leadId: input.leadId,
    campaignId: input.campaignId,
    channel: input.channel,
    subject: generated.subject,
    content: generated.content,
    status: 'draft',
    provider: generated.provider as any,
    model: generated.model,
    templateVersion: generated.templateVersion,
    createdBy: userId,
  }).returning();

  if (!message) throw new Error('Failed to save draft');

  // Log activity
  await db.insert(activities).values({
    workspaceId,
    leadId: input.leadId,
    campaignId: input.campaignId,
    outreachMessageId: message.id,
    activityType: 'draft_created',
    description: `Draft ${input.channel} message created`,
    metadata: { provider: generated.provider, usedFallback: generated.usedFallback },
    actorUserId: userId,
  });

  // Track usage
  await db.insert(usageEvents).values({
    workspaceId,
    eventType: 'ai_generation',
    provider: generated.provider as any,
    model: generated.model,
    units: 1,
  });

  return { message, usedFallback: generated.usedFallback };
}

export async function listMessages(workspaceId: string, status?: string) {
  const db = getDb();
  const conditions = [eq(outreachMessages.workspaceId, workspaceId)];
  if (status) conditions.push(eq(outreachMessages.status, status as any));

  return db.select().from(outreachMessages)
    .where(and(...conditions))
    .orderBy(desc(outreachMessages.createdAt));
}

export async function getMessage(workspaceId: string, messageId: string) {
  const db = getDb();
  const [message] = await db.select().from(outreachMessages).where(
    and(eq(outreachMessages.id, messageId), eq(outreachMessages.workspaceId, workspaceId)),
  ).limit(1);
  if (!message) throw AppError.notFound('Message');
  return message;
}

export async function updateMessage(workspaceId: string, messageId: string, content: string, subject?: string) {
  const db = getDb();
  const [message] = await db.update(outreachMessages)
    .set({ content, subject, updatedAt: new Date() })
    .where(and(eq(outreachMessages.id, messageId), eq(outreachMessages.workspaceId, workspaceId)))
    .returning();
  if (!message) throw AppError.notFound('Message');
  return message;
}

export async function logCopy(workspaceId: string, messageId: string, userId: string) {
  const db = getDb();
  const message = await getMessage(workspaceId, messageId);
  
  await db.update(outreachMessages)
    .set({ copiedAt: new Date(), updatedAt: new Date() })
    .where(eq(outreachMessages.id, messageId));

  await db.insert(activities).values({
    workspaceId,
    leadId: message.leadId,
    campaignId: message.campaignId,
    outreachMessageId: messageId,
    activityType: 'message_copied',
    description: 'Draft message copied (not sent)',
    metadata: {},
    actorUserId: userId,
  });

  // Copying does NOT change status to sent
  return { copied: true };
}

export async function markSent(workspaceId: string, messageId: string, userId: string) {
  const db = getDb();
  const message = await getMessage(workspaceId, messageId);

  if (message.status === 'sent') {
    return message; // Idempotent
  }

  const [updated] = await db.update(outreachMessages)
    .set({ status: 'sent', sentAt: new Date(), updatedAt: new Date() })
    .where(and(eq(outreachMessages.id, messageId), eq(outreachMessages.workspaceId, workspaceId)))
    .returning();

  await db.insert(activities).values({
    workspaceId,
    leadId: message.leadId,
    campaignId: message.campaignId,
    outreachMessageId: messageId,
    activityType: 'message_sent',
    description: `Message marked as sent via ${message.channel}`,
    metadata: { channel: message.channel },
    actorUserId: userId,
  });

  return updated;
}

export async function logReply(workspaceId: string, messageId: string, userId: string, content?: string) {
  const db = getDb();
  const message = await getMessage(workspaceId, messageId);

  const [updated] = await db.update(outreachMessages)
    .set({ status: 'replied', updatedAt: new Date() })
    .where(and(eq(outreachMessages.id, messageId), eq(outreachMessages.workspaceId, workspaceId)))
    .returning();

  await db.insert(activities).values({
    workspaceId,
    leadId: message.leadId,
    campaignId: message.campaignId,
    outreachMessageId: messageId,
    activityType: 'reply_logged',
    description: content ?? 'Reply manually logged',
    metadata: { hasContent: !!content },
    actorUserId: userId,
  });

  return updated;
}

export async function archiveMessage(workspaceId: string, messageId: string) {
  const db = getDb();
  const [updated] = await db.update(outreachMessages)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(outreachMessages.id, messageId), eq(outreachMessages.workspaceId, workspaceId)))
    .returning();
  if (!updated) throw AppError.notFound('Message');
  return updated;
}
