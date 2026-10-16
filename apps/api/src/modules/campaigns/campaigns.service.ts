import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { campaigns } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import type { CreateCampaignInput, UpdateCampaignInput } from '@leadpilot/shared';

export async function listCampaigns(
  workspaceId: string,
  query: Record<string, unknown>,
) {
  const db = getDb();
  const limit = Math.min(Number(query['limit'] ?? 25), 100);

  const items = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.workspaceId, workspaceId))
    .orderBy(desc(campaigns.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  const cursor = hasMore ? items[items.length - 1]?.id : undefined;
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(eq(campaigns.workspaceId, workspaceId));

  return { items, cursor, total: countResult?.count ?? 0 };
}

export async function createCampaign(
  workspaceId: string,
  userId: string,
  input: CreateCampaignInput,
) {
  const db = getDb();
  const [campaign] = await db
    .insert(campaigns)
    .values({ ...input, workspaceId, createdBy: userId })
    .returning();
  if (!campaign) throw new Error('Failed to create campaign');
  return campaign;
}

export async function getCampaign(workspaceId: string, campaignId: string) {
  const db = getDb();
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .limit(1);
  if (!campaign) throw AppError.notFound('Campaign');
  return campaign;
}

export async function updateCampaign(
  workspaceId: string,
  campaignId: string,
  input: UpdateCampaignInput,
) {
  const db = getDb();
  const [campaign] = await db
    .update(campaigns)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .returning();
  if (!campaign) throw AppError.notFound('Campaign');
  return campaign;
}

export async function archiveCampaign(workspaceId: string, campaignId: string) {
  const db = getDb();
  const [campaign] = await db
    .update(campaigns)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .returning({ id: campaigns.id });
  if (!campaign) throw AppError.notFound('Campaign');
}

// ─── Campaign Leads ──────────────────────────────────────────────────────────

export async function listCampaignLeads(workspaceId: string, campaignId: string) {
  await getCampaign(workspaceId, campaignId);
  const db = getDb();
  const rows = await db.query.campaignLeads.findMany({
    where: (cl, { eq, and }) => and(eq(cl.workspaceId, workspaceId), eq(cl.campaignId, campaignId)),
  });
  return rows;
}

export async function addLeadToCampaign(workspaceId: string, campaignId: string, leadId: string) {
  await getCampaign(workspaceId, campaignId);
  const db = getDb();
  const { campaignLeads } = await import('../../db/schema.js');
  const [cl] = await db
    .insert(campaignLeads)
    .values({
      workspaceId,
      campaignId,
      leadId,
      campaignStatus: 'new',
    })
    .onConflictDoNothing()
    .returning();
  return cl;
}

export async function updateCampaignLeadStatus(
  workspaceId: string,
  campaignId: string,
  leadId: string,
  status: 'new' | 'contacted' | 'replied' | 'interested' | 'not_interested' | 'archived',
) {
  const db = getDb();
  const { campaignLeads } = await import('../../db/schema.js');
  const [cl] = await db
    .update(campaignLeads)
    .set({ campaignStatus: status, updatedAt: new Date() })
    .where(
      and(
        eq(campaignLeads.workspaceId, workspaceId),
        eq(campaignLeads.campaignId, campaignId),
        eq(campaignLeads.leadId, leadId),
      ),
    )
    .returning();
  if (!cl) throw AppError.notFound('Campaign Lead');
  return cl;
}

export async function removeLeadFromCampaign(workspaceId: string, campaignId: string, leadId: string) {
  const db = getDb();
  const { campaignLeads } = await import('../../db/schema.js');
  await db
    .delete(campaignLeads)
    .where(
      and(
        eq(campaignLeads.workspaceId, workspaceId),
        eq(campaignLeads.campaignId, campaignId),
        eq(campaignLeads.leadId, leadId),
      ),
    );
}

