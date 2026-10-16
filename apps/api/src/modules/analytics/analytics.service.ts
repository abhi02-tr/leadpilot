import { eq, and, lt, count, sql } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { leads, campaigns, outreachMessages, followUpTasks, activities } from '../../db/schema.js';

export async function getDashboardSummary(workspaceId: string) {
  const db = getDb();
  const now = new Date();

  const [
    totalLeads,
    qualifiedLeads,
    activeCampaigns,
    draftsCreated,
    messagesSent,
    repliesLogged,
    followUpsDueToday,
    followUpsOverdue,
    recentActivities,
  ] = await Promise.all([
    // Total leads (not deleted)
    db.select({ count: sql<number>`count(*)::int` }).from(leads)
      .where(and(eq(leads.workspaceId, workspaceId))),

    // Qualified leads (score >= 60)
    db.select({ count: sql<number>`count(*)::int` }).from(leads)
      .where(and(eq(leads.workspaceId, workspaceId), sql`qualification_score >= 60`)),

    // Active campaigns
    db.select({ count: sql<number>`count(*)::int` }).from(campaigns)
      .where(and(eq(campaigns.workspaceId, workspaceId), eq(campaigns.status, 'active'))),

    // Drafts
    db.select({ count: sql<number>`count(*)::int` }).from(outreachMessages)
      .where(and(eq(outreachMessages.workspaceId, workspaceId), eq(outreachMessages.status, 'draft'))),

    // Messages sent
    db.select({ count: sql<number>`count(*)::int` }).from(outreachMessages)
      .where(and(eq(outreachMessages.workspaceId, workspaceId), eq(outreachMessages.status, 'sent'))),

    // Replies logged
    db.select({ count: sql<number>`count(*)::int` }).from(outreachMessages)
      .where(and(eq(outreachMessages.workspaceId, workspaceId), eq(outreachMessages.status, 'replied'))),

    // Follow-ups due today
    db.select({ count: sql<number>`count(*)::int` }).from(followUpTasks)
      .where(and(
        eq(followUpTasks.workspaceId, workspaceId),
        eq(followUpTasks.status, 'open'),
        sql`due_at <= (NOW() AT TIME ZONE 'UTC')::date + interval '1 day'`,
        sql`due_at >= (NOW() AT TIME ZONE 'UTC')::date`,
      )),

    // Follow-ups overdue
    db.select({ count: sql<number>`count(*)::int` }).from(followUpTasks)
      .where(and(
        eq(followUpTasks.workspaceId, workspaceId),
        eq(followUpTasks.status, 'open'),
        lt(followUpTasks.dueAt, now),
      )),

    // Recent activities (last 10)
    db.select().from(activities)
      .where(eq(activities.workspaceId, workspaceId))
      .orderBy(sql`occurred_at DESC`)
      .limit(10),
  ]);

  return {
    totalLeads: totalLeads[0]?.count ?? 0,
    qualifiedLeads: qualifiedLeads[0]?.count ?? 0,
    activeCampaigns: activeCampaigns[0]?.count ?? 0,
    draftsCreated: draftsCreated[0]?.count ?? 0,
    messagesSent: messagesSent[0]?.count ?? 0,
    repliesLogged: repliesLogged[0]?.count ?? 0,
    followUpsDueToday: followUpsDueToday[0]?.count ?? 0,
    followUpsOverdue: followUpsOverdue[0]?.count ?? 0,
    recentActivities,
  };
}
