# LeadPilot — Architecture

## Overview

Modular monolith. Backend serves a REST API consumed by the React SPA. No microservices.

```
apps/
  web/          # React + Vite + TypeScript SPA
  api/          # Express + TypeScript REST API
packages/
  shared/       # Zod schemas, types, constants (consumed by both apps)
docker-compose.yml
.env.example
README.md
```

## Backend Module Structure

```
apps/api/src/
  modules/
    auth/           # Registration, login, sessions, password reset
    workspaces/     # Workspace CRUD, membership, invitations
    campaigns/      # Campaign CRUD, status lifecycle
    leads/          # Lead CRUD, contacts, search, dedup
    discovery/      # Provider interface, manual/CSV adapters
    qualification/  # Scoring engine, signals, overrides
    outreach/       # Message CRUD, send/reply logging
    ai/             # Provider abstraction, template/Ollama/hosted adapters
    follow-ups/     # Task CRUD, completion, views
    imports/        # CSV parsing, field mapping, job tracking
    privacy/        # Suppression list, export, deletion
    analytics/      # Dashboard metrics, usage
    audit/          # Audit log writes and reads
  providers/
    ai/             # TemplateProvider, OllamaProvider, HostedProvider
    lead-sources/   # ManualProvider, CsvProvider, ExternalProvider (stub)
  jobs/             # Background/synchronous import processors
  db/               # Drizzle schema, migrations, connection
  middleware/
    auth.ts         # Session validation
    workspace.ts    # Workspace resolution + membership check
    rbac.ts         # Permission enforcement
    rateLimiter.ts  # Per-route rate limiting
    requestId.ts    # UUID request ID injection
    errorHandler.ts # Global error handler (no stack traces to client)
  lib/
    logger.ts       # Structured logging (pino), redaction rules
    errors.ts       # AppError class hierarchy
    validation.ts   # Zod middleware helpers
    crypto.ts       # Argon2, token generation, encryption
```

## Frontend Feature Structure

```
apps/web/src/
  components/       # Shared UI: Button, Input, Table, Dialog, Toast…
  features/
    auth/           # Login, Signup, Onboarding pages + API hooks
    campaigns/      # List, Detail, Form, Tabs
    discovery/      # Provider status, import wizard
    leads/          # List, Detail, Contacts, Notes, Merge UI
    outreach/       # Studio page, message list, history tabs
    follow-ups/     # Task views: Today, Upcoming, Overdue, Completed
    settings/       # Profile, AI config, Team, Usage, Suppression
    dashboard/      # Metrics cards, activity feed
  hooks/            # useWorkspace, useAuth, usePagination…
  lib/
    api.ts          # Axios/fetch client with auth headers and error normalization
    queryClient.ts  # TanStack Query setup
    router.tsx      # React Router configuration
```

## Authentication & Sessions

- express-session backed by database (connect-pg-simple)
- HttpOnly, SameSite=Lax, Secure (in production) cookies
- Session validated on every protected request by `auth` middleware
- Workspace membership verified by `workspace` middleware
- RBAC enforced by `rbac` middleware with explicit permission map

## AI Provider Interface

```typescript
interface AIProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  isAvailable(): Promise<boolean>;
  generate(prompt: GeneratePrompt): Promise<GeneratedContent>;
}
```

Cascade: configured hosted provider → Ollama → template fallback. Provider failure does not crash the request; it falls back and logs.

## Lead Source Interface

```typescript
interface LeadSourceProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  search(params: SearchParams): Promise<LeadCandidate[]>;
}
```

## Tenant Isolation Pattern

Every API handler that touches tenant data:
1. Reads `req.session.userId`
2. Resolves workspace from URL param or header via middleware
3. Verifies user is a workspace member (middleware)
4. Passes `workspaceId` to service/repository, never trusting client-supplied value
5. Repository always includes `WHERE workspace_id = $1` in every query

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | Drizzle | Type-safe, SQL-close, great migration tooling |
| Auth | Sessions (not JWT) | Simpler revocation, no token storage on client |
| AI fallback | Template first | Works with zero credentials |
| Import size | Env-configurable (default 1000 rows) | Prevents abuse |
| Pagination | Cursor-based | Stable under concurrent inserts |
| Merge | Explicit + auditable | No silent data loss |
| Sending | NEVER automated | Core product principle |
