import { eq, and, desc, ilike, gte, lte, sql, isNull } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import { leads, leadContacts, activities } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import { normalizeBusinessName, normalizeDomain } from '../../lib/crypto.js';
import type { CreateLeadInput, UpdateLeadInput, LeadFilters, CreateContactInput } from '@leadpilot/shared';

export async function listLeads(workspaceId: string, filters: LeadFilters) {
  const db = getDb();
  const limit = Math.min(filters.limit ?? 25, 100);

  const conditions = [
    eq(leads.workspaceId, workspaceId),
    isNull(leads.deletedAt),
  ];

  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.niche) conditions.push(ilike(leads.niche, `%${filters.niche}%`));
  if (filters.city) conditions.push(ilike(leads.city, `%${filters.city}%`));
  if (filters.websiteStatus) conditions.push(eq(leads.websiteStatus, filters.websiteStatus));
  if (filters.sourceType) conditions.push(eq(leads.sourceType, filters.sourceType));
  if (filters.scoreMin !== undefined) conditions.push(gte(leads.qualificationScore, filters.scoreMin));
  if (filters.scoreMax !== undefined) conditions.push(lte(leads.qualificationScore, filters.scoreMax));
  if (filters.search) {
    conditions.push(ilike(leads.businessName, `%${filters.search}%`));
  }

  const items = await db
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  if (hasMore) items.pop();
  const cursor = hasMore ? items[items.length - 1]?.id : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(...conditions));

  return { items, cursor, total: countResult?.count ?? 0 };
}

export async function createLead(workspaceId: string, input: CreateLeadInput) {
  const db = getDb();

  const normalizedName = normalizeBusinessName(input.businessName);
  const normalizedDomain = input.websiteUrl ? normalizeDomain(input.websiteUrl) : null;

  const [lead] = await db
    .insert(leads)
    .values({ ...input, workspaceId, normalizedName, normalizedDomain: normalizedDomain ?? undefined })
    .returning();

  if (!lead) throw new Error('Failed to create lead');

  // Log activity
  await db.insert(activities).values({
    workspaceId,
    leadId: lead.id,
    activityType: 'lead_created',
    description: `Lead "${lead.businessName}" created`,
    metadata: { source: input.sourceType },
  });

  return lead;
}

export async function getLead(workspaceId: string, leadId: string) {
  const db = getDb();
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId), isNull(leads.deletedAt)))
    .limit(1);
  if (!lead) throw AppError.notFound('Lead');
  return lead;
}

export async function updateLead(workspaceId: string, leadId: string, input: UpdateLeadInput) {
  const db = getDb();

  const updates: Partial<typeof leads.$inferInsert> = { ...input, updatedAt: new Date() };
  if (input.businessName) updates.normalizedName = normalizeBusinessName(input.businessName);
  if (input.websiteUrl) updates.normalizedDomain = normalizeDomain(input.websiteUrl) ?? undefined;

  const [lead] = await db
    .update(leads)
    .set(updates)
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId), isNull(leads.deletedAt)))
    .returning();

  if (!lead) throw AppError.notFound('Lead');

  await db.insert(activities).values({
    workspaceId,
    leadId,
    activityType: 'lead_updated',
    description: 'Lead updated',
    metadata: { changes: Object.keys(input) },
  });

  return lead;
}

export async function deleteLead(workspaceId: string, leadId: string) {
  const db = getDb();
  const [lead] = await db
    .update(leads)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId), isNull(leads.deletedAt)))
    .returning({ id: leads.id });
  if (!lead) throw AppError.notFound('Lead');
}

export async function getLeadActivities(workspaceId: string, leadId: string) {
  // Verify lead belongs to workspace first
  await getLead(workspaceId, leadId);
  const db = getDb();
  return db
    .select()
    .from(activities)
    .where(and(eq(activities.leadId, leadId), eq(activities.workspaceId, workspaceId)))
    .orderBy(desc(activities.occurredAt));
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function getLeadContacts(workspaceId: string, leadId: string) {
  await getLead(workspaceId, leadId);
  const db = getDb();
  return db.select().from(leadContacts).where(
    and(eq(leadContacts.leadId, leadId), eq(leadContacts.workspaceId, workspaceId)),
  );
}

export async function createContact(workspaceId: string, leadId: string, input: CreateContactInput) {
  await getLead(workspaceId, leadId);
  const db = getDb();
  const [contact] = await db
    .insert(leadContacts)
    .values({ ...input, workspaceId, leadId })
    .returning();
  if (!contact) throw new Error('Failed to create contact');
  return contact;
}

export async function deleteContact(workspaceId: string, leadId: string, contactId: string) {
  const db = getDb();
  const [contact] = await db
    .delete(leadContacts)
    .where(
      and(
        eq(leadContacts.id, contactId),
        eq(leadContacts.leadId, leadId),
        eq(leadContacts.workspaceId, workspaceId),
      ),
    )
    .returning({ id: leadContacts.id });
  if (!contact) throw AppError.notFound('Contact');
}

// ─── CSV Import / Export & Deduplication ─────────────────────────────────────

export interface CsvImportRow {
  businessName: string;
  websiteUrl?: string;
  niche?: string;
  city?: string;
  region?: string;
  countryCode?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export async function importLeadsFromCsv(workspaceId: string, rows: CsvImportRow[]) {
  const db = getDb();
  const MAX_ROWS = Number(process.env.MAX_IMPORT_ROWS ?? 1000);
  if (rows.length > MAX_ROWS) {
    throw AppError.badRequest(`Import file contains ${rows.length} rows, which exceeds maximum of ${MAX_ROWS}`);
  }

  let inserted = 0;
  let duplicates = 0;
  const errors: string[] = [];

  const seenInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const name = row.businessName?.trim();
    if (!name) {
      errors.push(`Row ${i + 1}: Business name is required`);
      continue;
    }

    const normName = normalizeBusinessName(name);
    const normDomain = row.websiteUrl ? normalizeDomain(row.websiteUrl) : null;
    const dedupKey = normDomain ? `dom:${normDomain}` : `name:${normName}`;

    if (seenInBatch.has(dedupKey)) {
      duplicates++;
      continue;
    }
    seenInBatch.add(dedupKey);

    // Check existing in workspace
    const existing = await db.query.leads.findFirst({
      where: (l, { eq, and, or, isNull }) =>
        and(
          eq(l.workspaceId, workspaceId),
          isNull(l.deletedAt),
          or(
            eq(l.normalizedName, normName),
            normDomain ? eq(l.normalizedDomain, normDomain) : eq(l.normalizedName, normName),
          ),
        ),
    });

    if (existing) {
      duplicates++;
      continue;
    }

    try {
      const [newLead] = await db
        .insert(leads)
        .values({
          workspaceId,
          businessName: name,
          normalizedName: normName,
          normalizedDomain: normDomain ?? undefined,
          websiteUrl: row.websiteUrl?.trim() || null,
          websiteStatus: row.websiteUrl ? 'present' : 'unknown',
          niche: row.niche?.trim() || null,
          city: row.city?.trim() || null,
          region: row.region?.trim() || null,
          countryCode: row.countryCode ? row.countryCode.trim().toUpperCase().slice(0, 2) : undefined,
          sourceType: 'csv',
          status: 'new',
        })
        .returning();

      if (newLead) {
        inserted++;

        if (row.contactEmail) {
          await db.insert(leadContacts).values({
            workspaceId,
            leadId: newLead.id,
            contactType: 'email',
            value: row.contactEmail.trim().toLowerCase(),
            verificationStatus: 'unverified',
          });
        }

        if (row.contactPhone) {
          await db.insert(leadContacts).values({
            workspaceId,
            leadId: newLead.id,
            contactType: 'phone',
            value: row.contactPhone.trim(),
            verificationStatus: 'unverified',
          });
        }
      }
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  // Activity log for import
  await db.insert(activities).values({
    workspaceId,
    leadId: (await db.query.leads.findFirst({ where: eq(leads.workspaceId, workspaceId) }))?.id || workspaceId,
    activityType: 'import_completed',
    description: `CSV import completed: ${inserted} inserted, ${duplicates} duplicates skipped`,
    metadata: { inserted, duplicates, errorCount: errors.length },
  });

  return { totalRows: rows.length, inserted, duplicates, errors };
}

export async function exportLeadsToCsv(workspaceId: string, filters: LeadFilters): Promise<string> {
  const result = await listLeads(workspaceId, { ...filters, limit: 1000 });
  const db = getDb();

  const headers = [
    'ID',
    'Business Name',
    'Niche',
    'Website',
    'City',
    'Region',
    'Country',
    'Status',
    'Qualification Score',
    'Contacts',
  ];

  const lines = [headers.join(',')];

  for (const lead of result.items) {
    const contacts = await db.query.leadContacts.findMany({
      where: (lc, { eq, and }) => and(eq(lc.workspaceId, workspaceId), eq(lc.leadId, lead.id)),
    });
    const contactSummary = contacts.map((c) => `${c.contactType}:${c.value}`).join('; ');

    const row = [
      lead.id,
      escapeCsv(lead.businessName),
      escapeCsv(lead.niche ?? ''),
      escapeCsv(lead.websiteUrl ?? ''),
      escapeCsv(lead.city ?? ''),
      escapeCsv(lead.region ?? ''),
      escapeCsv(lead.countryCode ?? ''),
      lead.status,
      lead.qualificationScore ?? '',
      escapeCsv(contactSummary),
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

