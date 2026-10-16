import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const RoleEnum = z.enum(['owner', 'admin', 'member', 'viewer']);
export type Role = z.infer<typeof RoleEnum>;

export const CampaignStatusEnum = z.enum(['draft', 'active', 'paused', 'completed', 'archived']);
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;

export const CampaignObjectiveEnum = z.enum([
  'start_conversation',
  'book_demo',
  'ask_permission',
  'follow_up',
]);
export type CampaignObjective = z.infer<typeof CampaignObjectiveEnum>;

export const ChannelEnum = z.enum(['email', 'instagram', 'whatsapp']);
export type Channel = z.infer<typeof ChannelEnum>;

export const LanguageEnum = z.enum(['english', 'gujarati', 'hindi', 'hinglish']);
export type Language = z.infer<typeof LanguageEnum>;

export const ToneEnum = z.enum(['friendly', 'conversational', 'professional', 'consultative', 'direct']);
export type Tone = z.infer<typeof ToneEnum>;

export const LengthEnum = z.enum(['short', 'standard', 'detailed']);
export type Length = z.infer<typeof LengthEnum>;

export const LeadStatusEnum = z.enum([
  'new',
  'qualified',
  'ready_to_contact',
  'contacted',
  'replied',
  'interested',
  'meeting',
  'converted',
  'not_qualified',
  'not_interested',
  'invalid',
  'do_not_contact',
  'archived',
]);
export type LeadStatus = z.infer<typeof LeadStatusEnum>;

export const SourceTypeEnum = z.enum(['api', 'manual', 'csv', 'website']);
export type SourceType = z.infer<typeof SourceTypeEnum>;

export const WebsiteStatusEnum = z.enum(['unknown', 'present', 'absent']);
export type WebsiteStatus = z.infer<typeof WebsiteStatusEnum>;

export const ContactTypeEnum = z.enum(['email', 'phone', 'instagram', 'whatsapp', 'other']);
export type ContactType = z.infer<typeof ContactTypeEnum>;

export const VerificationStatusEnum = z.enum(['unverified', 'verified', 'invalid']);
export type VerificationStatus = z.infer<typeof VerificationStatusEnum>;

export const OutreachStatusEnum = z.enum(['draft', 'sent', 'replied', 'archived']);
export type OutreachStatus = z.infer<typeof OutreachStatusEnum>;

export const FollowUpStatusEnum = z.enum(['open', 'completed', 'cancelled']);
export type FollowUpStatus = z.infer<typeof FollowUpStatusEnum>;

export const ActivityTypeEnum = z.enum([
  'lead_created',
  'lead_updated',
  'draft_created',
  'message_copied',
  'message_sent',
  'reply_logged',
  'note_added',
  'status_changed',
  'follow_up_created',
  'follow_up_completed',
  'import_completed',
]);
export type ActivityType = z.infer<typeof ActivityTypeEnum>;

export const ImportStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed']);
export type ImportStatus = z.infer<typeof ImportStatusEnum>;

export const AIProviderEnum = z.enum(['template', 'ollama', 'hosted']);
export type AIProvider = z.infer<typeof AIProviderEnum>;

// ─── API request schemas ───────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  workspaceName: z.string().min(1).max(100),
  timezone: z.string().default('UTC'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  timezone: z.string().default('UTC'),
});

export const GeographySchema = z.object({
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  countryCode: z.string().length(2).optional(),
});

export const ICPConfigSchema = z.object({
  nicheKeywords: z.array(z.string()).optional(),
  minEmployees: z.number().int().positive().optional(),
  maxEmployees: z.number().int().positive().optional(),
  businessType: z.string().optional(),
  signals: z.array(z.string()).optional(),
  weights: z.object({
    nicheFit: z.number().min(0).max(100).default(30),
    geographyFit: z.number().min(0).max(100).default(20),
    verifiedActivity: z.number().min(0).max(100).default(15),
    onlineStoreNeed: z.number().min(0).max(100).default(20),
    contactChannel: z.number().min(0).max(100).default(15),
  }).optional(),
});

export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  niche: z.string().min(1).max(200),
  geography: GeographySchema.optional(),
  icpConfig: ICPConfigSchema.optional(),
  offer: z.string().min(1).max(2000),
  objective: CampaignObjectiveEnum.optional(),
  channels: z.array(ChannelEnum).min(1).optional(),
  language: LanguageEnum.optional(),
  tone: ToneEnum.optional(),
  status: CampaignStatusEnum.default('draft'),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const UpdateCampaignSchema = CreateCampaignSchema.partial();
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

export const CreateLeadSchema = z.object({
  businessName: z.string().min(1).max(300),
  niche: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  websiteUrl: z.string().url().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  countryCode: z.string().length(2).optional(),
  sourceType: SourceTypeEnum.default('manual'),
  sourceUrl: z.string().url().max(500).optional(),
  status: LeadStatusEnum.default('new'),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = CreateLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export const CreateContactSchema = z.object({
  contactType: ContactTypeEnum,
  value: z.string().min(1).max(500),
  sourceUrl: z.string().url().max(500).optional(),
  verificationStatus: VerificationStatusEnum.default('unverified'),
});
export type CreateContactInput = z.infer<typeof CreateContactSchema>;

export const GenerateOutreachSchema = z.object({
  leadId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  channel: ChannelEnum,
  language: LanguageEnum.default('english'),
  tone: ToneEnum.default('conversational'),
  objective: CampaignObjectiveEnum.default('start_conversation'),
  length: LengthEnum.default('standard'),
  provider: AIProviderEnum.optional(),
});
export type GenerateOutreachInput = z.infer<typeof GenerateOutreachSchema>;

export const CreateFollowUpSchema = z.object({
  leadId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  notes: z.string().max(5000).optional(),
  dueAt: z.string().datetime(),
  assignedTo: z.string().uuid().optional(),
});
export type CreateFollowUpInput = z.infer<typeof CreateFollowUpSchema>;

export const LeadFiltersSchema = z.object({
  campaignId: z.string().uuid().optional(),
  status: LeadStatusEnum.optional(),
  niche: z.string().optional(),
  city: z.string().optional(),
  scoreMin: z.coerce.number().min(0).max(100).optional(),
  scoreMax: z.coerce.number().min(0).max(100).optional(),
  websiteStatus: WebsiteStatusEnum.optional(),
  sourceType: SourceTypeEnum.optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
});
export type LeadFilters = z.infer<typeof LeadFiltersSchema>;

// ─── API response shapes ───────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  data: T;
  meta: {
    requestId: string;
    cursor?: string;
    total?: number;
  };
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    requestId: string;
  };
};

// ─── RBAC permissions ─────────────────────────────────────────────────────────

export const PERMISSIONS = {
  owner: [
    'workspace:delete',
    'workspace:transfer',
    'member:manage',
    'member:remove',
    'member:invite',
    'lead:delete',
    'lead:merge',
    'lead:export',
    'campaign:delete',
    'settings:ai',
    'settings:billing',
    'audit:read',
    'suppression:manage',
  ],
  admin: [
    'member:manage',
    'member:invite',
    'lead:delete',
    'lead:merge',
    'lead:export',
    'campaign:delete',
    'settings:ai',
    'audit:read',
    'suppression:manage',
  ],
  member: [
    'lead:create',
    'lead:update',
    'lead:read',
    'campaign:create',
    'campaign:update',
    'campaign:read',
    'outreach:create',
    'outreach:update',
    'follow_up:create',
    'follow_up:update',
    'import:create',
  ],
  viewer: [
    'lead:read',
    'campaign:read',
    'outreach:read',
    'follow_up:read',
  ],
} as const satisfies Record<Role, string[]>;

export function hasPermission(role: Role, permission: string): boolean {
  // Owner has all permissions
  if (role === 'owner') return true;
  const rolePerms = PERMISSIONS[role] as readonly string[];
  // Higher roles inherit lower role permissions
  const allPerms: string[] = [...rolePerms];
  if (role === 'admin') allPerms.push(...(PERMISSIONS.member as readonly string[]), ...(PERMISSIONS.viewer as readonly string[]));
  if (role === 'member') allPerms.push(...(PERMISSIONS.viewer as readonly string[]));
  return allPerms.includes(permission);
}
