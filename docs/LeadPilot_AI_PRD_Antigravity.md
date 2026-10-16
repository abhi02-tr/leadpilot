# LeadPilot AI — Product Requirements & Implementation Specification

> **Audience:** Coding agent (Antigravity)  
> **Document type:** Source-of-truth PRD and implementation guide  
> **Version:** 1.0  
> **Status:** Approved for MVP implementation  
> **Primary use case:** Acquire merchants for BizzPocket  
> **Product:** Multi-tenant SaaS web application for business lead discovery, qualification, personalized outreach drafting, and follow-up management

---

## 0. Instructions for the Coding Agent

Treat this document as the source of truth for the MVP. Inspect the existing repository before making changes. If the repository already contains a working implementation, preserve its conventions and extend it rather than replacing it wholesale.

### Required working method

1. Inspect the repository, package manager, current framework, database, environment configuration, and existing tests.
2. Write a short implementation plan and identify any conflicts with this PRD.
3. Implement in small, working vertical slices. Do not generate the entire application as one unreviewed change.
4. Keep the app runnable after each milestone.
5. Add database migrations, validation, authorization, and tests with each relevant feature.
6. Run available lint, type-check, test, and build commands. Fix failures introduced by the changes.
7. Never claim an external provider, integration, test, or deployment works unless it has actually been configured and verified.
8. If a required external credential is missing, implement a clear configuration state and a mock/template fallback rather than fabricating successful results.
9. Do not expose secrets in frontend code, logs, screenshots, error messages, or committed files.
10. Update the README and `.env.example` as implementation changes.
11. Ask a concise question only if a material product decision cannot be resolved from this document or the repository. Otherwise, use the defaults specified here.
12. Prioritize a secure, usable MVP over unnecessary abstractions or speculative features.

### Definition of success

A user can register, create a workspace and campaign, import or manually add business leads, qualify them, generate a message using a local model, hosted model, or deterministic template fallback, copy the message, manually log sending or a reply, and manage follow-ups. All tenant data must be isolated and the core workflow must be tested.

---

## 1. Product Overview

### 1.1 Vision

Build a web application that helps founders and small sales teams go from a niche idea to qualified business prospects, personalized outreach drafts, and tracked follow-ups in one place.

### 1.2 Problem

Prospecting currently requires manually searching for businesses, collecting data in spreadsheets, deciding which prospects are relevant, writing messages separately for each business, and tracking conversations and reminders in disconnected tools.

### 1.3 Proposed solution

LeadPilot AI provides a unified workflow:

1. Create a campaign for a niche, location, ideal customer profile (ICP), and offer.
2. Discover or import prospects through approved sources, CSV, or manual entry.
3. Deduplicate and qualify leads using transparent, evidence-based signals.
4. Generate personalized cold email, Instagram DM, or WhatsApp message drafts.
5. Edit and copy drafts; send messages manually outside the application.
6. Record interactions and manage follow-up tasks.
7. Review basic campaign and workspace metrics.

### 1.4 Initial customer and use case

The first validating user is the founder/operator acquiring merchants for **BizzPocket**, an online-store creation product. The first example campaign may target saree sellers, clothing boutiques, and other local retailers in Surat/Gujarat, India.

The architecture must support other niches, geographies, workspaces, and SaaS customers without being hardcoded to BizzPocket.

### 1.5 Product principles

- Free-first, but do not assume third-party services remain free.
- Human-reviewed outreach; no automatic sending in the MVP.
- Evidence-based qualification and personalization.
- Source provenance for collected data.
- Multi-tenant isolation from the first database migration.
- Provider-agnostic AI and lead discovery.
- Modular monolith, not microservices.
- Useful error states and graceful fallbacks.
- Measure qualified leads and meaningful replies, not just volume.

---

## 2. Scope

### 2.1 MVP — must have (P0)

- Authentication and workspace creation.
- Workspace membership and role-based access control (RBAC).
- Campaign CRUD and lifecycle.
- Lead CRUD, contact details, tags/statuses, and search.
- CSV import with field mapping, validation, duplicate detection, and row-level results.
- CSV export with authorization checks.
- Manual lead creation.
- Pluggable lead-discovery interface and at least one usable provider adapter when credentials and terms permit; manual/CSV workflows must work without provider credentials.
- Evidence-based lead qualification score with rationale and manual override.
- AI provider interface supporting:
  - deterministic template fallback,
  - optional local model through Ollama,
  - optional hosted AI provider through a server-side API.
- Draft generation for cold email, Instagram DM, and WhatsApp.
- Draft editing, saving, copying, and explicit manual logging of sent messages/replies.
- Lead activity history.
- Follow-up task creation, rescheduling, completion, cancellation, and overdue views.
- Suppression/do-not-contact controls.
- Basic dashboard and usage counters.
- Security tests for cross-tenant access.
- README, `.env.example`, migrations, and local development setup.

### 2.2 Later — not required for initial MVP

- Automated Instagram or WhatsApp sending.
- Automated email sequences, warm-up, or mass outreach.
- Advanced workflow automation.
- Enterprise SSO or complex enterprise permissions.
- Subscription billing and payment processing.
- Public integration marketplace.
- Advanced sales forecasting.
- Scraping behind login walls or bypassing access controls.
- Any scraping or messaging integration that violates a provider's current terms.

### 2.3 Sending policy

The MVP must **not send messages automatically**. The supported flow is:

`Generate draft → Review/edit → Copy → Send manually outside LeadPilot → Explicitly mark as sent → Log reply manually`

Copying a draft is not sending. The app must not infer that a message was sent merely because it was generated or copied.

---

## 3. User Roles and Tenant Model

### 3.1 Roles

- **Owner:** Manage workspace, members, settings, data, and deletion/export controls.
- **Admin:** Manage workspace data and members, except owner-only operations.
- **Member:** Create and update leads, campaigns, drafts, and activities.
- **Viewer:** Read permitted workspace data and analytics.
- **Platform admin:** Operate the SaaS service. No routine unrestricted access to tenant message contents.

Implement permissions with an explicit permission map, not string ordering.

### 3.2 Tenant isolation

Every tenant-owned table must contain `workspace_id`, even if the tenant can also be inferred through relationships. Every read and write must be scoped to an authorized workspace on the server.

Never trust a client-supplied workspace ID as proof of access. Verify membership and resource ownership on every request. Ensure related records (for example, campaign and lead) belong to the same workspace.

Use database constraints/composite foreign keys where practical. Consider PostgreSQL Row-Level Security (RLS) as defense in depth; it does not replace application authorization.

---

## 4. Information Architecture and Screens

Use a responsive, desktop-first SaaS UI with a left navigation sidebar, workspace switcher, global search, and a main content area. Reuse existing design-system conventions if the repository already has them. Otherwise, prefer React, TypeScript, Tailwind CSS, and shadcn/ui where compatible.

Navigation:

- Dashboard
- Campaigns
- Discover / Import
- Leads
- Outreach
- Follow-ups
- Settings

### 4.1 Sign-up, login, and onboarding

Routes: `/signup`, `/login`, `/onboarding`

Fields:
- Name, email, password, optional OAuth if already supported.
- Workspace name and timezone.
- Optional business name/website.
- Optional first campaign niche, geography, objective, and offer.

Requirements:
- New user creates a workspace or joins through an invitation.
- Email verification and secure password reset if email infrastructure is configured.
- Onboarding can be skipped and resumed.
- Do not ask for third-party credentials through URL parameters.

### 4.2 Dashboard

Route: `/app`

Show:
- Total leads and qualified leads.
- Active campaigns.
- Drafts created.
- Messages explicitly logged as sent.
- Replies manually recorded.
- Follow-ups due today and overdue.
- Recent activity.
- Quick actions: New Campaign, Import Leads, Add Lead.

Metrics must be scoped to the authorized workspace, use clearly defined date ranges, and distinguish drafts from sent messages. Provide useful empty states.

### 4.3 Campaign list and detail

Routes:
- `/app/campaigns`
- `/app/campaigns/new`
- `/app/campaigns/:campaignId`

Campaign fields:
- `name` (required)
- `niche` (required)
- `geography` (structured object)
- `icp_config` (validated JSON object)
- `offer` (required)
- `objective` (enum)
- `channels` (validated array)
- `language` (validated enum)
- `tone` (validated enum)
- `status` (`draft`, `active`, `paused`, `completed`, `archived`)

Campaign detail tabs: Overview, Leads, Outreach, Settings.

The same lead may be associated with multiple campaigns. Campaign-specific lead status must not overwrite the lead's global status.

### 4.4 Discover and import

Routes: `/app/discover`, `/app/import`

Acquisition modes:
1. Approved provider search.
2. CSV import.
3. Manual entry.

CSV import flow:
- Upload CSV.
- Validate size, encoding, headers, row count, and values.
- Map source columns to supported fields.
- Preview sample rows and validation errors.
- Flag likely duplicates.
- Confirm import.
- Display imported, skipped, duplicate, and failed row counts.
- Provide row-level error download/view.
- Track job status and prevent accidental repeated processing.

Manual entry must remain functional if no discovery provider is configured.

### 4.5 Leads list and detail

Routes:
- `/app/leads`
- `/app/leads/:leadId`

List columns:
- Business name.
- Niche and location.
- Website status.
- Qualification score.
- Global status.
- Last contact.
- Next follow-up.
- Source.

Filters:
- Campaign, niche, city/region/country, status, score range, website status, source, and follow-up date.

Lead detail tabs:
- Overview
- Contacts
- Qualification
- Outreach history
- Activities

Requirements:
- Server-side search, filtering, and pagination.
- Bulk operations require confirmation where destructive.
- Merge duplicates only with explicit confirmation and an auditable outcome.
- Contact details retain source and verification status.
- Support do-not-contact status and suppression checks.

### 4.6 Qualification

Route: `/app/leads/:leadId/qualification`

Initial suggested scoring weights, configurable by campaign:
- Niche fit: +30
- Geography fit: +20
- Verified business activity: +15
- Evidence of potential need for an online store: +20
- Usable contact channel: +15

Normalize the final score to 0–100. Missing data is unknown, not automatically negative. Display score, signal, rationale, source, and evidence timestamp. Allow a manual override and optional reason. A score is an estimate, not a conversion probability. Do not rank prospects using sensitive personal attributes.

### 4.7 Outreach studio

Route: `/app/outreach/new?leadId=...`

Inputs:
- Lead and campaign.
- Channel: `email`, `instagram`, `whatsapp`.
- Language: English, Gujarati, Hindi, Hinglish.
- Tone: friendly, conversational, professional, consultative, direct.
- Objective: start conversation, book demo, ask permission to share details, follow up.
- Length: short, standard, detailed.
- AI provider/model if configured.

Output:
- Email: subject and body.
- Instagram DM: concise message.
- WhatsApp: concise business message.

Actions:
- Generate
- Regenerate
- Edit
- Save Draft
- Copy
- Mark Sent
- Log Reply
- Archive

Requirements:
- Use stored, verified business facts only.
- Never fabricate business facts, familiarity, reviews, or claims.
- Validate model output and render it as text, not executable HTML.
- Provider failure must produce a clear error and use a deterministic template fallback when possible.
- Store generation provider, model, and template version where available.
- Copying does not mark the message sent.
- Mark Sent requires explicit user action and records the timestamp.

### 4.8 Outreach activity history

Route: `/app/outreach`

Views: Drafts, Sent, Replied, Interested, Archived.

Track lead, campaign, channel, content, event type, actor, and event time. Replies are manually recorded in the MVP; do not imply automatic inbox monitoring.

### 4.9 Follow-ups

Route: `/app/follow-ups`

Views: Today, Upcoming, Overdue, Completed.

Task fields: lead, campaign, title/action, notes, due time, status, assignee, creator.

Requirements:
- Store timestamps in UTC and display in workspace timezone.
- Completion must be idempotent.
- Users can reschedule, snooze, complete, cancel, and reopen if permitted.
- Do-not-contact or not-interested leads must not receive follow-up suggestions.

### 4.10 Settings

Routes:
- `/app/settings`
- `/app/settings/ai`
- `/app/settings/team`
- `/app/settings/usage`

Include profile, workspace/timezone, members/roles, AI mode, provider configuration, usage limits, suppression list, export/deletion, and audit events.

Never return raw provider credentials from an API. Store credentials encrypted at rest or use a secret manager. If encryption cannot be configured safely, do not persist the secret and explain the configuration requirement.

---

## 5. Recommended Technology and Architecture

Inspect the existing repository first. If starting from an empty repository, use:

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- React Router
- TanStack Query
- React Hook Form
- Zod

### Backend
- Node.js
- TypeScript
- Express or Fastify (choose one and use it consistently)
- REST API
- Zod request validation
- Centralized authorization middleware
- Structured logging

### Data
- PostgreSQL
- Drizzle ORM and migrations
- UUID primary keys
- JSONB only for flexible configuration/provider metadata
- Normal columns for frequently filtered fields

### Jobs
Start with synchronous processing for small operations and database-backed jobs for larger imports. Add Redis/BullMQ only when there is a demonstrated need for queues, retries, or scheduled processing.

### AI provider interface
Create a provider-neutral interface. Support:
1. Deterministic template generator (must work without credentials).
2. Local model through Ollama (optional).
3. Hosted AI provider through a server-side API (optional).

Do not couple business logic to a single model vendor.

### Lead source interface
Create a provider-neutral interface. Support:
1. Manual entry.
2. CSV import.
3. An approved external business data source when credentials and terms permit.

Do not scrape login-protected content, bypass platform controls, or assume publicly visible data is unrestricted for collection or reuse.

### Architecture
Use a modular monolith. Suggested modules:
- `auth`
- `workspaces`
- `campaigns`
- `leads`
- `discovery`
- `qualification`
- `outreach`
- `ai`
- `follow-ups`
- `imports`
- `privacy`
- `analytics`
- `audit`

Keep business rules in services, data access in repositories, and HTTP concerns in controllers/routes. Do not create microservices for the MVP.

---

## 6. Database Schema

Use UUID primary keys and `created_at`/`updated_at` where appropriate. All tenant-owned tables include `workspace_id`. Use foreign keys, check constraints, and indexes. Exact Drizzle syntax should follow the installed version.

### 6.1 `users`
- `id` UUID PK
- `email` normalized text, unique
- `name` text, required
- `password_hash` text, nullable for OAuth-only identity
- `email_verified_at` timestamptz nullable
- `created_at`, `updated_at` timestamptz

If OAuth is implemented, use an `auth_identities` table rather than overloading user fields.

### 6.2 `workspaces`
- `id` UUID PK
- `name` text
- `slug` text, unique
- `timezone` text
- `owner_user_id` UUID FK to users
- `created_at` timestamptz
- `deleted_at` timestamptz nullable

### 6.3 `workspace_members`
- `workspace_id` UUID FK
- `user_id` UUID FK
- `role` enum: `owner`, `admin`, `member`, `viewer`
- `joined_at` timestamptz
- Composite PK: `(workspace_id, user_id)`

### 6.4 `campaigns`
- `id` UUID PK
- `workspace_id` UUID FK
- `name` text required
- `niche` text required
- `geography` JSONB
- `icp_config` JSONB
- `offer` text required
- `objective` enum
- `channels` text array
- `language` text
- `tone` text
- `status` enum: `draft`, `active`, `paused`, `completed`, `archived`
- `created_by` UUID FK to users
- `created_at`, `updated_at` timestamptz

### 6.5 `leads`
- `id` UUID PK
- `workspace_id` UUID FK
- `business_name` text required
- `normalized_name` text
- `niche` text nullable
- `description` text nullable
- `website_url` text nullable
- `normalized_domain` text nullable
- `city`, `region` text nullable
- `country_code` char(2) nullable
- `source_type` enum: `api`, `manual`, `csv`, `website`
- `source_url` text nullable
- `source_metadata` JSONB, non-sensitive metadata only
- `website_status` enum: `unknown`, `present`, `absent`
- `qualification_score` integer nullable, constrained 0–100
- `status` enum: `new`, `qualified`, `ready_to_contact`, `contacted`, `replied`, `interested`, `meeting`, `converted`, `not_qualified`, `not_interested`, `invalid`, `do_not_contact`, `archived`
- `do_not_contact` boolean default false
- `created_at`, `updated_at` timestamptz
- `deleted_at` timestamptz nullable

Do not set `website_status = absent` without sufficient evidence. It may mean no website has been found, not proof that none exists.

### 6.6 `lead_contacts`
- `id` UUID PK
- `workspace_id` UUID FK
- `lead_id` UUID FK
- `contact_type` enum: `email`, `phone`, `instagram`, `whatsapp`, `other`
- `value` text
- `normalized_value` text
- `source_url` text nullable
- `verification_status` enum: `unverified`, `verified`, `invalid`
- `last_verified_at` timestamptz nullable
- `created_at` timestamptz

Do not impose a global unique constraint on contact values across tenants. Use workspace-scoped matching/indexing.

### 6.7 `campaign_leads`
- `workspace_id` UUID FK
- `campaign_id` UUID FK
- `lead_id` UUID FK
- `campaign_status` enum
- `qualification_result` JSONB nullable
- `added_at`, `updated_at` timestamptz
- Composite PK: `(campaign_id, lead_id)`

Ensure the campaign and lead belong to the same workspace, ideally using composite foreign keys.

### 6.8 `qualification_results`
- `id` UUID PK
- `workspace_id` UUID FK
- `lead_id` UUID FK
- `campaign_id` UUID nullable FK
- `score` integer constrained 0–100
- `signals` JSONB
- `model_version` text nullable
- `reasoning_summary` text containing concise evidence-based explanation
- `reviewed_by` UUID nullable FK
- `created_at` timestamptz

Do not store hidden/private chain-of-thought. Store concise scoring rationale and supporting evidence.

### 6.9 `outreach_messages`
- `id` UUID PK
- `workspace_id` UUID FK
- `lead_id` UUID FK
- `campaign_id` UUID nullable FK
- `channel` enum: `email`, `instagram`, `whatsapp`
- `subject` text nullable
- `content` text
- `status` enum: `draft`, `sent`, `replied`, `archived`
- `provider` text nullable
- `model` text nullable
- `template_version` text nullable
- `created_by` UUID FK
- `created_at`, `updated_at` timestamptz
- `sent_at` timestamptz nullable

Use a separate `copied_at` or activity event if copy tracking is needed. Copying is not sending.

### 6.10 `activities`
- `id` UUID PK
- `workspace_id` UUID FK
- `lead_id` UUID FK
- `campaign_id` UUID nullable FK
- `outreach_message_id` UUID nullable FK
- `activity_type` enum: `lead_created`, `lead_updated`, `draft_created`, `message_copied`, `message_sent`, `reply_logged`, `note_added`, `status_changed`, `follow_up_created`, `follow_up_completed`, `import_completed`
- `description` text nullable
- `metadata` JSONB
- `actor_user_id` UUID nullable FK
- `occurred_at`, `created_at` timestamptz

Activity history should be append-only for normal users. Corrections must be auditable.

### 6.11 `follow_up_tasks`
- `id` UUID PK
- `workspace_id` UUID FK
- `lead_id` UUID FK
- `campaign_id` UUID nullable FK
- `title` text
- `notes` text nullable
- `due_at` timestamptz
- `status` enum: `open`, `completed`, `cancelled`
- `completed_at` timestamptz nullable
- `assigned_to` UUID nullable FK
- `created_by` UUID FK
- `created_at`, `updated_at` timestamptz

### 6.12 Supporting tables
Implement as needed by the relevant milestone:
- `import_jobs`: status, source filename, row counts, error summary, idempotency key, timestamps.
- `ai_provider_configs`: provider, model, enabled state, encrypted credential or secret reference, safe settings.
- `suppression_entries`: workspace, normalized contact identifier, reason, scope, creation time.
- `audit_logs`: actor, workspace, action, resource type/id, timestamp, safe metadata.
- `usage_events`: workspace, event type, provider/model, units, estimated cost where known, timestamp.
- `workspace_invitations`: hashed token, role, expiry, inviter, accepted time.
- `refresh_tokens`: hashed token identifier, user, expiry, revoked time, if refresh tokens are used.

### 6.13 Required indexes
At minimum:
- `leads(workspace_id, status)`
- `leads(workspace_id, created_at DESC)`
- `campaigns(workspace_id, status)`
- `follow_up_tasks(workspace_id, status, due_at)`
- `outreach_messages(workspace_id, lead_id, created_at DESC)`
- `lead_contacts(workspace_id, lead_id)`
- Unique `(campaign_id, lead_id)` on `campaign_leads`
- Appropriate indexes for normalized domains and contact matching.

Use transactions for imports, merges, and multi-record status changes. Test migrations from a clean database.

---

## 7. REST API Specification

Base path: `/api/v1`.

### 7.1 Conventions
- JSON request/response bodies.
- UUID resource identifiers.
- Secure session cookies or bearer authentication.
- Server-side workspace authorization.
- Zod validation at API boundaries.
- Cursor pagination for large lists; default page size 25, maximum 100.
- ISO 8601 UTC timestamps.
- Request IDs and consistent error responses.
- Idempotency keys for retry-prone imports/jobs.
- Never return SQL errors, stack traces, raw secrets, or provider credentials.

Success shape:

```json
{
  "data": {},
  "meta": {
    "requestId": "request-uuid"
  }
}
```

Error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "name",
        "message": "Name is required."
      }
    ],
    "requestId": "request-uuid"
  }
}
```

### 7.2 Authentication and workspaces

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh` if refresh tokens are used
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /me`
- `GET /workspaces`
- `POST /workspaces`
- `GET /workspaces/:workspaceId/members`
- `POST /workspaces/:workspaceId/invitations`
- `PATCH /workspaces/:workspaceId/members/:userId`
- `DELETE /workspaces/:workspaceId/members/:userId`

### 7.3 Campaigns

- `GET /campaigns`
- `POST /campaigns`
- `GET /campaigns/:id`
- `PATCH /campaigns/:id`
- `DELETE /campaigns/:id` — archive by default
- `POST /campaigns/:id/leads`
- `GET /campaigns/:id/leads`
- `PATCH /campaigns/:id/leads/:leadId`
- `DELETE /campaigns/:id/leads/:leadId`

### 7.4 Leads and contacts

- `GET /leads`
- `POST /leads`
- `GET /leads/:id`
- `PATCH /leads/:id`
- `DELETE /leads/:id`
- `POST /leads/bulk-update`
- `POST /leads/merge`
- `GET /leads/:id/activities`
- `GET /leads/:id/contacts`
- `POST /leads/:id/contacts`
- `PATCH /leads/:id/contacts/:contactId`
- `DELETE /leads/:id/contacts/:contactId`
- `POST /leads/:id/qualification`

Support server-side filtering by campaign, status, niche, city, score, website status, source, and search term.

### 7.5 Discovery, import, and export

- `GET /discovery/providers`
- `POST /discovery/searches` — asynchronous job; return `202`
- `GET /discovery/searches/:id`
- `POST /imports`
- `GET /imports/:id`
- `GET /imports/:id/errors`
- `GET /exports/leads`

A provider must report configured/unconfigured status, availability, and applicable limits without exposing credentials. External searches must respect provider terms and limits.

### 7.6 AI and outreach

- `GET /ai/providers`
- `POST /ai/generate-outreach`
- `POST /outreach/messages`
- `GET /outreach/messages`
- `GET /outreach/messages/:id`
- `PATCH /outreach/messages/:id`
- `POST /outreach/messages/:id/copy-log` (optional)
- `POST /outreach/messages/:id/mark-sent`
- `POST /outreach/messages/:id/log-reply`
- `POST /outreach/messages/:id/archive`

Do not implement automated-send endpoints in the MVP.

Example generation request:

```json
{
  "leadId": "lead-uuid",
  "campaignId": "campaign-uuid",
  "channel": "instagram",
  "language": "hinglish",
  "tone": "conversational",
  "objective": "start_conversation",
  "length": "short"
}
```

Validate all fields server-side. Return a saved or unsaved draft with provider/model/template metadata. Use `422` for invalid semantic inputs, `429` for quota exhaustion, and `503` when generation and fallback are unavailable.

### 7.7 Follow-ups, activities, and operations

- `GET /follow-ups`
- `POST /follow-ups`
- `PATCH /follow-ups/:id`
- `POST /follow-ups/:id/complete`
- `POST /follow-ups/:id/cancel`
- `POST /activities`
- `GET /dashboard/summary`
- `GET /usage/summary`
- `GET /suppression-list`
- `POST /suppression-list`
- `DELETE /suppression-list/:id`

### 7.8 HTTP status codes
- `200`: successful read/update
- `201`: created
- `202`: asynchronous job accepted
- `204`: successful operation without response body
- `400`: malformed request
- `401`: unauthenticated
- `403`: insufficient permissions
- `404`: unavailable/not found
- `409`: duplicate/conflict
- `413`: upload too large
- `422`: semantic validation failure
- `429`: rate/usage limit
- `500`: unexpected internal error
- `503`: provider/dependency unavailable

---

## 8. Security and Privacy Requirements

### 8.1 Authentication and authorization
- Hash passwords with Argon2id or a maintained equivalent.
- Prefer secure HttpOnly, SameSite cookies for browser sessions; protect state-changing requests against CSRF.
- Rotate and revoke refresh tokens if used.
- Rate-limit login, reset, invitations, imports, and AI generation.
- Enforce RBAC and tenant access on every protected endpoint.
- Use generic responses where needed to prevent resource enumeration.

### 8.2 Tenant isolation
- Scope all tenant queries by authorized `workspace_id`.
- Validate membership for every operation.
- Enforce tenant consistency for relationships.
- Test cross-tenant read, update, export, merge, and delete attempts.
- Background jobs must carry validated tenant context.

### 8.3 AI security
- Treat imported data, website text, and model output as untrusted.
- Do not execute generated content.
- Prevent prompt injection from overriding system behavior.
- Keep provider keys server-side and encrypted at rest or in a secret manager.
- Bound input size, output tokens, execution time, and per-workspace usage.
- Do not send unnecessary contact details to hosted models.
- Never allow cross-tenant context to enter prompts.
- Store concise evidence-based scoring explanations, not private model chain-of-thought.

### 8.4 Application security
- Validate URLs, MIME types, file sizes, and CSV row counts.
- Escape untrusted content in the UI.
- Prevent SSRF when fetching user-supplied URLs: block private IP ranges, unsafe redirects, localhost, and cloud metadata endpoints.
- Redact secrets, tokens, and unnecessary personal data from logs.
- Use HTTPS in production.
- Configure CORS narrowly.
- Add secure headers and dependency auditing.
- Do not commit real `.env` files.

### 8.5 Privacy and outreach
- Record source and collection time for lead data.
- Honor opt-outs and suppression entries.
- Make export and deletion workflows available to authorized users.
- Set documented retention periods.
- Require explicit user action to mark messages as sent.
- Do not send messages automatically when a follow-up becomes due.
- Follow applicable privacy, marketing, and platform requirements.
- Public visibility does not imply unrestricted collection or reuse.

---

## 9. Non-Functional Requirements

Initial targets; external provider latency and free-tier hosting are excluded from ordinary API latency measurements.

- P95 under 500 ms for ordinary database-backed API requests under modest load.
- Server-side pagination; default 25, maximum 100.
- Provider timeouts and failures must not corrupt user data.
- Responsive layout and accessible form controls/focus states.
- Structured logs, request IDs, and actionable error tracking.
- Docker-based local development.
- Documented migrations and environment variables.
- Transactions for imports, merges, and multi-record operations.
- TypeScript, linting, formatting, unit tests, integration tests, and end-to-end tests.
- Per-workspace usage quotas and bounded background jobs.
- Do not claim an uptime SLA on free hosting.

---

## 10. API and Data Validation Rules

Use Zod schemas for request bodies, query parameters, environment variables, provider responses where possible, and AI outputs.

- Reject unknown enum values.
- Enforce length limits on names, descriptions, notes, and messages.
- Validate URLs and allowed schemes.
- Normalize domains, emails, and phone numbers where appropriate.
- Validate score range 0–100.
- Validate channel/language/tone combinations.
- Apply maximum import size and row limits.
- Use transactions and idempotency for retryable operations.
- Do not allow a lead and campaign from different workspaces to be linked.
- Use optimistic concurrency or safe update semantics where concurrent edits could overwrite data.
- Ensure deletion and merge operations are auditable.

---

## 11. Acceptance Criteria and Test Plan

All items must be implemented and tested before the relevant feature is considered done.

### Authentication and tenancy
- Registration, login, logout, password reset, and session expiry work.
- User A cannot access User B's workspace records by changing IDs.
- Unauthorized members cannot perform owner/admin operations.
- Background jobs cannot access data outside their validated workspace.
- Sensitive changes and exports are audited.

### Campaigns and leads
- Create, edit, pause, complete, and archive campaigns.
- A lead can belong to multiple campaigns.
- Campaign-specific status does not overwrite global lead status.
- Search, filters, and pagination work server-side.
- Invalid input produces a useful validation response.

### Import and discovery
- Valid CSV rows import.
- Malformed rows are reported without crashing the import.
- Duplicate rows are flagged and not silently duplicated.
- Repeated import jobs are idempotent where applicable.
- Provider timeouts/quotas are shown clearly.
- Manual entry and CSV workflows work without external provider credentials.

### Qualification
- Score and rationale are displayed.
- Missing data is treated as unknown.
- Manual overrides work and are recorded.
- Score is clearly labeled as an estimate, not a conversion probability.

### AI outreach
- Template fallback works without AI credentials.
- Local/hosted provider failures return a clear status and use fallback when available.
- Output is validated and displayed as plain text.
- No fabricated business facts are inserted by templates.
- Copying a draft does not mark it sent.
- Mark Sent requires explicit user action.
- Provider metadata and template version are recorded where available.
- Usage limits are enforced.

### Follow-ups and privacy
- Create, reschedule, complete, cancel, and list tasks.
- UTC timestamps display correctly in workspace timezone.
- Completed/cancelled tasks are handled idempotently.
- Suppressed or not-interested leads are excluded from outreach suggestions.
- Authorized export works and deletion follows the documented policy.

### Release definition of done
For each feature:
1. API and validation implemented.
2. Authorization and tenant isolation enforced.
3. UI loading, empty, error, and success states implemented.
4. Database migrations included.
5. Unit tests cover business logic.
6. Integration tests cover main success/failure paths.
7. Logs do not expose secrets.
8. Documentation is updated.
9. Lint, type-check, tests, and build pass, or existing unrelated failures are documented clearly.

---

## 12. Prioritized Implementation Backlog

Implement in vertical slices. These IDs are references, not a requirement to work strictly serially.

### Milestone 1 — Foundation (P0)
- **LP-001: Repository setup**
  - Inspect existing repository; configure app structure, scripts, linting, formatting, tests, and Docker Compose.
  - Add `.env.example` and README.
- **LP-002: PostgreSQL and migrations**
  - Configure Drizzle, schema, constraints, indexes, seed, and migration commands.
- **LP-003: Authentication**
  - Registration, login, logout, password reset/session management, tests, and rate limits.
- **LP-004: Workspaces and RBAC**
  - Membership, roles, authorization service, tenant-scoped repositories, and cross-tenant tests.
- **LP-005: Application shell**
  - Responsive sidebar, workspace switcher, navigation, error handling, and base design system.

### Milestone 2 — Campaigns and leads (P0)
- **LP-006: Campaign CRUD**
  - Campaign forms, status lifecycle, validation, pagination.
- **LP-007: Lead CRUD and contacts**
  - List/detail pages, filters, contacts, notes, source provenance.
- **LP-008: CSV import/export**
  - Mapping, validation, preview, row errors, job history, file limits.
- **LP-009: Deduplication**
  - Normalization, duplicate review, explicit merge.
- **LP-010: Campaign membership**
  - Add/remove leads and manage campaign-specific statuses.
- **LP-011: Discovery provider interface**
  - Manual/CSV adapters and one approved external provider if credentials and terms permit.

### Milestone 3 — Qualification and outreach (P0)
- **LP-012: Qualification engine**
  - Configurable weights, evidence summary, manual overrides.
- **LP-013: AI provider abstraction**
  - Template fallback, optional Ollama adapter, optional hosted provider, timeouts and quotas.
- **LP-014: Prompt templates**
  - Channel-specific prompts, supported languages, validation, template versions.
- **LP-015: Outreach studio**
  - Generate/edit/save/copy drafts and show provider/usage states.
- **LP-016: Activity logging**
  - Draft, copy, manually sent, reply, note, and status-change events.
- **LP-017: Follow-up tasks**
  - Create/reschedule/complete/cancel, due-date views, suppression safeguards.

### Milestone 4 — SaaS readiness (P1)
- **LP-018: Dashboard and usage**
  - Workspace metrics and usage accounting.
- **LP-019: Suppression and privacy**
  - Suppression list, export/deletion workflows, retention rules.
- **LP-020: Audit and logging**
  - Request IDs, structured logs, sensitive-action audit events.
- **LP-021: Team management**
  - Invitations, roles, revocation, permission tests.
- **LP-022: End-to-end tests**
  - Complete workflow from campaign creation through follow-up.
- **LP-023: Deployment**
  - Production secrets, HTTPS, database backups where supported, migration and rollback instructions.

### Recommended first vertical slice
1. Sign in.
2. Create a campaign.
3. Add a lead manually.
4. Generate a template-backed message.
5. Copy the draft.
6. Mark it sent manually.
7. Create a follow-up task.

Then add CSV import, AI providers, discovery integrations, analytics, and team features.

---

## 13. Budget and Free-First Strategy

The target is zero incremental spend during local development and the earliest viable hosted trial, not a guarantee of permanent zero-cost production.

- Develop locally using Docker and PostgreSQL.
- Use open-source libraries for the app and database layer.
- Make the template generator fully functional without an AI key.
- Support Ollama when local hardware permits.
- Use hosted AI only when configured and within a workspace quota.
- Start with manual discovery and CSV import.
- Add external business data APIs only after reviewing current pricing, quotas, and terms.
- Avoid paid enrichment databases until the product demonstrates value.
- Make provider quotas, errors, and availability visible.
- Do not hardcode assumptions that a provider's free tier will always exist.

---

## 14. Suggested Repository Structure

Adapt to the existing repository; do not duplicate an existing structure unnecessarily.

```text
leadpilot/
  apps/
    web/
      src/
        components/
        features/
          auth/
          campaigns/
          discovery/
          leads/
          outreach/
          follow-ups/
          settings/
        hooks/
        lib/
    api/
      src/
        modules/
          auth/
          workspaces/
          campaigns/
          leads/
          discovery/
          qualification/
          outreach/
          ai/
          follow-ups/
          imports/
          privacy/
          analytics/
          audit/
        providers/
          ai/
          lead-sources/
        jobs/
        db/
        middleware/
        lib/
  packages/
    shared/
  docker-compose.yml
  README.md
  .env.example
```

---

## 15. Environment Configuration

Create `.env.example` with placeholder values only. Validate required configuration at startup.

```dotenv
NODE_ENV=development

WEB_URL=http://localhost:5173
API_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leadpilot

SESSION_SECRET=
ENCRYPTION_KEY=

AI_DEFAULT_PROVIDER=template
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=
HOSTED_AI_API_KEY=

LEAD_PROVIDER=
LEAD_PROVIDER_API_KEY=

MAX_IMPORT_ROWS=1000
MAX_AI_GENERATIONS_PER_DAY=50
```

These are illustrative variable names. Adapt them to the chosen libraries/providers. Never commit real credentials. Use strong generated secrets outside source control. If secure secret encryption is not configured, disable persistence of provider credentials rather than storing them in plaintext.

---

## 16. Suggested Product Metrics

Track these metrics without claiming that more leads automatically means more sales:

- Qualified leads per hour.
- Qualification rate.
- Outreach preparation time.
- Messages drafted and messages explicitly logged as sent.
- Positive reply rate, based on manually recorded outcomes.
- Follow-up completion rate.
- Meeting/demo conversion.
- Cost per qualified lead, where costs can be measured.
- Lead data quality and verification rate.

Establish a manual-workflow baseline before setting numerical targets. Avoid reporting a reply rate without a defined denominator and date range.

---

## 17. Final Implementation Priorities

1. Secure tenant foundation.
2. Campaign and lead CRUD.
3. CSV/manual acquisition and deduplication.
4. Template-backed outreach.
5. Qualification and activity history.
6. Follow-up tasks.
7. Optional local/hosted AI.
8. Approved external discovery provider.
9. Usage, privacy, analytics, and team readiness.

The differentiator is the complete workflow:

**Niche → Prospects → Qualification → Personalized Draft → Manual Outreach → Follow-up → Conversion**

Build and verify the first vertical slice before adding advanced features. Keep the application usable without external API credentials and never fabricate provider results.
