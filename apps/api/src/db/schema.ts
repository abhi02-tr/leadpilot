import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  char,
  index,
  uniqueIndex,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['owner', 'admin', 'member', 'viewer']);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 'active', 'paused', 'completed', 'archived',
]);

export const campaignObjectiveEnum = pgEnum('campaign_objective', [
  'start_conversation', 'book_demo', 'ask_permission', 'follow_up',
]);

export const channelEnum = pgEnum('channel', ['email', 'instagram', 'whatsapp']);

export const languageEnum = pgEnum('language', ['english', 'gujarati', 'hindi', 'hinglish']);

export const toneEnum = pgEnum('tone', [
  'friendly', 'conversational', 'professional', 'consultative', 'direct',
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new', 'qualified', 'ready_to_contact', 'contacted', 'replied',
  'interested', 'meeting', 'converted', 'not_qualified', 'not_interested',
  'invalid', 'do_not_contact', 'archived',
]);

export const sourceTypeEnum = pgEnum('source_type', ['api', 'manual', 'csv', 'website']);

export const websiteStatusEnum = pgEnum('website_status', ['unknown', 'present', 'absent']);

export const contactTypeEnum = pgEnum('contact_type', [
  'email', 'phone', 'instagram', 'whatsapp', 'other',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'unverified', 'verified', 'invalid',
]);

export const outreachStatusEnum = pgEnum('outreach_status', [
  'draft', 'sent', 'replied', 'archived',
]);

export const followUpStatusEnum = pgEnum('follow_up_status', [
  'open', 'completed', 'cancelled',
]);

export const activityTypeEnum = pgEnum('activity_type', [
  'lead_created', 'lead_updated', 'draft_created', 'message_copied',
  'message_sent', 'reply_logged', 'note_added', 'status_changed',
  'follow_up_created', 'follow_up_completed', 'import_completed',
]);

export const importStatusEnum = pgEnum('import_status', [
  'pending', 'processing', 'completed', 'failed',
]);

export const aiProviderEnum = pgEnum('ai_provider', ['template', 'ollama', 'hosted']);

export const campaignLeadStatusEnum = pgEnum('campaign_lead_status', [
  'new', 'contacted', 'replied', 'interested', 'not_interested', 'archived',
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

// 6.1 users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 6.2 workspaces
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  timezone: text('timezone').notNull().default('UTC'),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// 6.3 workspace_members
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workspaceId, t.userId] }),
    workspaceIdx: index('wm_workspace_idx').on(t.workspaceId),
  }),
);

// 6.4 campaigns
export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    niche: text('niche').notNull(),
    geography: jsonb('geography'),
    icpConfig: jsonb('icp_config'),
    offer: text('offer').notNull(),
    objective: campaignObjectiveEnum('objective'),
    channels: text('channels').array(),
    language: languageEnum('language'),
    tone: toneEnum('tone'),
    status: campaignStatusEnum('status').notNull().default('draft'),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceStatusIdx: index('campaigns_workspace_status_idx').on(t.workspaceId, t.status),
    workspaceCreatedIdx: index('campaigns_workspace_created_idx').on(t.workspaceId, t.createdAt),
  }),
);

// 6.5 leads
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    businessName: text('business_name').notNull(),
    normalizedName: text('normalized_name'),
    niche: text('niche'),
    description: text('description'),
    websiteUrl: text('website_url'),
    normalizedDomain: text('normalized_domain'),
    city: text('city'),
    region: text('region'),
    countryCode: char('country_code', { length: 2 }),
    sourceType: sourceTypeEnum('source_type').notNull().default('manual'),
    sourceUrl: text('source_url'),
    sourceMetadata: jsonb('source_metadata'),
    websiteStatus: websiteStatusEnum('website_status').notNull().default('unknown'),
    qualificationScore: integer('qualification_score'),
    status: leadStatusEnum('status').notNull().default('new'),
    doNotContact: boolean('do_not_contact').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceStatusIdx: index('leads_workspace_status_idx').on(t.workspaceId, t.status),
    workspaceCreatedIdx: index('leads_workspace_created_idx').on(t.workspaceId, t.createdAt),
    normalizedDomainIdx: index('leads_normalized_domain_idx').on(t.workspaceId, t.normalizedDomain),
    normalizedNameIdx: index('leads_normalized_name_idx').on(t.workspaceId, t.normalizedName),
    scoreCheck: check('leads_score_range', sql`qualification_score IS NULL OR (qualification_score >= 0 AND qualification_score <= 100)`),
  }),
);

// 6.6 lead_contacts
export const leadContacts = pgTable(
  'lead_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    contactType: contactTypeEnum('contact_type').notNull(),
    value: text('value').notNull(),
    normalizedValue: text('normalized_value'),
    sourceUrl: text('source_url'),
    verificationStatus: verificationStatusEnum('verification_status').notNull().default('unverified'),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    leadIdx: index('lead_contacts_lead_idx').on(t.workspaceId, t.leadId),
    workspaceLeadIdx: index('lead_contacts_workspace_idx').on(t.workspaceId),
  }),
);

// 6.7 campaign_leads
export const campaignLeads = pgTable(
  'campaign_leads',
  {
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    campaignStatus: campaignLeadStatusEnum('campaign_status').notNull().default('new'),
    qualificationResult: jsonb('qualification_result'),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.campaignId, t.leadId] }),
    campaignIdx: index('campaign_leads_campaign_idx').on(t.workspaceId, t.campaignId),
  }),
);

// 6.8 qualification_results
export const qualificationResults = pgTable(
  'qualification_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id),
    score: integer('score').notNull(),
    signals: jsonb('signals').notNull(),
    modelVersion: text('model_version'),
    reasoningSummary: text('reasoning_summary').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    scoreCheck: check('qual_score_range', sql`score >= 0 AND score <= 100`),
    leadIdx: index('qual_results_lead_idx').on(t.workspaceId, t.leadId),
  }),
);

// 6.9 outreach_messages
export const outreachMessages = pgTable(
  'outreach_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id),
    channel: channelEnum('channel').notNull(),
    subject: text('subject'),
    content: text('content').notNull(),
    status: outreachStatusEnum('status').notNull().default('draft'),
    provider: aiProviderEnum('provider'),
    model: text('model'),
    templateVersion: text('template_version'),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    copiedAt: timestamp('copied_at', { withTimezone: true }),
  },
  (t) => ({
    leadCreatedIdx: index('outreach_lead_created_idx').on(t.workspaceId, t.leadId, t.createdAt),
    workspaceStatusIdx: index('outreach_workspace_status_idx').on(t.workspaceId, t.status),
  }),
);

// 6.10 activities
export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id),
    outreachMessageId: uuid('outreach_message_id').references(() => outreachMessages.id),
    activityType: activityTypeEnum('activity_type').notNull(),
    description: text('description'),
    metadata: jsonb('metadata').notNull().default({}),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    leadOccurredIdx: index('activities_lead_occurred_idx').on(t.workspaceId, t.leadId, t.occurredAt),
    workspaceIdx: index('activities_workspace_idx').on(t.workspaceId, t.occurredAt),
  }),
);

// 6.11 follow_up_tasks
export const followUpTasks = pgTable(
  'follow_up_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id),
    title: text('title').notNull(),
    notes: text('notes'),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    status: followUpStatusEnum('status').notNull().default('open'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    assignedTo: uuid('assigned_to').references(() => users.id),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceStatusDueIdx: index('follow_ups_workspace_status_due_idx').on(t.workspaceId, t.status, t.dueAt),
    leadIdx: index('follow_ups_lead_idx').on(t.workspaceId, t.leadId),
  }),
);

// 6.12 Supporting tables

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    idempotencyKey: text('idempotency_key').notNull(),
    status: importStatusEnum('status').notNull().default('pending'),
    sourceFilename: text('source_filename').notNull(),
    totalRows: integer('total_rows').notNull().default(0),
    importedRows: integer('imported_rows').notNull().default(0),
    skippedRows: integer('skipped_rows').notNull().default(0),
    duplicateRows: integer('duplicate_rows').notNull().default(0),
    failedRows: integer('failed_rows').notNull().default(0),
    errorSummary: jsonb('error_summary'),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => ({
    workspaceIdx: index('import_jobs_workspace_idx').on(t.workspaceId, t.createdAt),
    idempotencyIdx: uniqueIndex('import_jobs_idempotency_idx').on(t.workspaceId, t.idempotencyKey),
  }),
);

export const aiProviderConfigs = pgTable(
  'ai_provider_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    provider: aiProviderEnum('provider').notNull(),
    model: text('model'),
    enabled: boolean('enabled').notNull().default(false),
    // Encrypted credential reference (never plaintext API key)
    encryptedCredential: text('encrypted_credential'),
    safeSettings: jsonb('safe_settings'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceProviderIdx: uniqueIndex('ai_configs_workspace_provider_idx').on(t.workspaceId, t.provider),
  }),
);

export const suppressionEntries = pgTable(
  'suppression_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    normalizedContact: text('normalized_contact').notNull(),
    reason: text('reason'),
    scope: text('scope').notNull().default('workspace'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceContactIdx: uniqueIndex('suppression_workspace_contact_idx').on(t.workspaceId, t.normalizedContact),
  }),
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: uuid('resource_id'),
    safeMetadata: jsonb('safe_metadata'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceOccurredIdx: index('audit_logs_workspace_idx').on(t.workspaceId, t.occurredAt),
  }),
);

export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    provider: aiProviderEnum('provider'),
    model: text('model'),
    units: integer('units').notNull().default(1),
    estimatedCostUsd: text('estimated_cost_usd'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceOccurredIdx: index('usage_events_workspace_idx').on(t.workspaceId, t.occurredAt),
    workspaceTypeIdx: index('usage_events_type_idx').on(t.workspaceId, t.eventType, t.occurredAt),
  }),
);

export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: roleEnum('role').notNull().default('member'),
    hashedToken: text('hashed_token').notNull().unique(),
    invitedBy: uuid('invited_by').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    workspaceIdx: index('invitations_workspace_idx').on(t.workspaceId),
  }),
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    hashedToken: text('hashed_token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('refresh_tokens_user_idx').on(t.userId),
  }),
);

// ─── Import job errors (separate table for row-level errors) ─────────────────

export const importJobErrors = pgTable(
  'import_job_errors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    importJobId: uuid('import_job_id').notNull().references(() => importJobs.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
    rowNumber: integer('row_number').notNull(),
    rowData: jsonb('row_data'),
    errorMessage: text('error_message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    importJobIdx: index('import_job_errors_job_idx').on(t.importJobId),
  }),
);
