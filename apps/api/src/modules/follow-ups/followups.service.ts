import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { followUpTasks, activities, leads } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import type { CreateFollowUpInput } from '@leadpilot/shared';

export async function listFollowUps(workspaceId: string, view?: string) {
  const db = getDb();
  const now = new Date();
  const conditions = [eq(followUpTasks.workspaceId, workspaceId)];

  if (view === 'today') {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    conditions.push(eq(followUpTasks.status, 'open'));
  } else if (view === 'overdue') {
    conditions.push(eq(followUpTasks.status, 'open'));
    // dueAt < now
  } else if (view === 'completed') {
    conditions.push(eq(followUpTasks.status, 'completed'));
  } else if (view === 'upcoming') {
    conditions.push(eq(followUpTasks.status, 'open'));
  }

  return db.select().from(followUpTasks)
    .where(and(...conditions))
    .orderBy(followUpTasks.dueAt);
}

export async function createFollowUp(workspaceId: string, userId: string, input: CreateFollowUpInput) {
  const db = getDb();

  // Verify lead belongs to workspace and is not DNC
  const [lead] = await db.select({ id: leads.id, doNotContact: leads.doNotContact, status: leads.status })
    .from(leads)
    .where(and(eq(leads.id, input.leadId), eq(leads.workspaceId, workspaceId)))
    .limit(1);

  if (!lead) throw AppError.notFound('Lead');
  if (lead.doNotContact || lead.status === 'not_interested') {
    throw AppError.forbidden('Cannot create follow-up for a do-not-contact or not-interested lead.');
  }

  const [task] = await db.insert(followUpTasks).values({
    ...input,
    workspaceId,
    createdBy: userId,
    dueAt: new Date(input.dueAt),
  }).returning();

  if (!task) throw new Error('Failed to create follow-up task');

  await db.insert(activities).values({
    workspaceId,
    leadId: input.leadId,
    campaignId: input.campaignId,
    activityType: 'follow_up_created',
    description: `Follow-up task created: ${input.title}`,
    metadata: { taskId: task.id, dueAt: input.dueAt },
    actorUserId: userId,
  });

  return task;
}

export async function getFollowUp(workspaceId: string, taskId: string) {
  const db = getDb();
  const [task] = await db.select().from(followUpTasks)
    .where(and(eq(followUpTasks.id, taskId), eq(followUpTasks.workspaceId, workspaceId)))
    .limit(1);
  if (!task) throw AppError.notFound('Follow-up task');
  return task;
}

export async function updateFollowUp(workspaceId: string, taskId: string, input: Partial<CreateFollowUpInput>) {
  const db = getDb();
  const updates = { ...input, updatedAt: new Date() } as any;
  if (input.dueAt) updates.dueAt = new Date(input.dueAt);

  const [task] = await db.update(followUpTasks)
    .set(updates)
    .where(and(eq(followUpTasks.id, taskId), eq(followUpTasks.workspaceId, workspaceId)))
    .returning();
  if (!task) throw AppError.notFound('Follow-up task');
  return task;
}

export async function completeFollowUp(workspaceId: string, taskId: string, userId: string) {
  const db = getDb();
  const task = await getFollowUp(workspaceId, taskId);

  if (task.status === 'completed') {
    return task; // Idempotent
  }

  const [updated] = await db.update(followUpTasks)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(followUpTasks.id, taskId), eq(followUpTasks.workspaceId, workspaceId)))
    .returning();

  await db.insert(activities).values({
    workspaceId,
    leadId: task.leadId,
    campaignId: task.campaignId,
    activityType: 'follow_up_completed',
    description: `Follow-up completed: ${task.title}`,
    metadata: { taskId },
    actorUserId: userId,
  });

  return updated;
}

export async function cancelFollowUp(workspaceId: string, taskId: string) {
  const db = getDb();
  const [task] = await db.update(followUpTasks)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(followUpTasks.id, taskId), eq(followUpTasks.workspaceId, workspaceId)))
    .returning();
  if (!task) throw AppError.notFound('Follow-up task');
  return task;
}
