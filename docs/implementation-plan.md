# LeadPilot — Implementation Plan

> **Version:** 1.0 | **Status:** Active | **Source of truth:** `LeadPilot_AI_PRD_Antigravity.md`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Backend | Node.js + TypeScript + Express |
| ORM | Drizzle ORM + drizzle-kit |
| Database | PostgreSQL 16 |
| Auth | express-session + argon2 |
| Validation | Zod (shared schemas in `packages/shared`) |
| Testing | Vitest (unit/integration) + Playwright (E2E) |
| Dev infra | Docker Compose |

---

## Milestone 1 — Foundation (P0)

### LP-001: Repository Setup
- **Objective:** Initialize monorepo, tooling, Docker Compose, env template
- **Outputs:** `apps/web`, `apps/api`, `packages/shared`, root `package.json`, `.env.example`, `README.md`, `docker-compose.yml`
- **Acceptance criteria:** `docker compose up -d` starts Postgres; both apps start without errors; lint+typecheck pass
- **Status:** ✅ Complete

### LP-002: PostgreSQL & Migrations
- **Objective:** Full Drizzle schema for all 18 tables, indexes, migration scripts, seed
- **Tables:** users, workspaces, workspace_members, campaigns, leads, lead_contacts, campaign_leads, qualification_results, outreach_messages, activities, follow_up_tasks, import_jobs, ai_provider_configs, suppression_entries, audit_logs, usage_events, workspace_invitations, refresh_tokens
- **Acceptance criteria:** `npm run db:migrate` applies cleanly; all constraints and indexes present; `workspace_id` on every tenant table; score constrained 0–100
- **Dependencies:** LP-001
- **Status:** ✅ Complete

### LP-003: Authentication
- **Objective:** Register, login, logout, password reset with secure sessions
- **Endpoints:** POST /auth/register|login|logout|forgot-password|reset-password; GET /me
- **Security:** Argon2id hashing; HttpOnly SameSite cookie; rate limits (5 login/15min, 10 register/hr, 3 reset/hr)
- **Acceptance criteria:** All auth flows work; passwords never logged; 429 on rate limit breach; 401 on unauthenticated access
- **Dependencies:** LP-002
- **Status:** ✅ Complete

### LP-004: Workspaces & RBAC
- **Objective:** Workspace CRUD, membership, RBAC permission map, tenant-scoped repos
- **Permission matrix:** owner > admin > member > viewer (explicit map, not string ordering)
- **Acceptance criteria:** Cross-tenant access returns 403/404; owner cannot be removed; RBAC enforced on every endpoint
- **Dependencies:** LP-003
- **Status:** ✅ Complete

### LP-005: Application Shell
- **Objective:** React frontend shell: layout, routing, auth guards, design system
- **Screens:** Login, Signup, Onboarding, responsive sidebar nav
- **Acceptance criteria:** Nav links work; unauthenticated redirect to /login; sidebar collapses on mobile; error boundary present
- **Dependencies:** LP-003, LP-004
- **Status:** ✅ Complete

---

## Milestone 2 — Campaigns & Leads (P0)

### LP-006: Campaign CRUD — Status:** ✅ Complete
### LP-007: Lead CRUD & Contacts — Status:** ✅ Complete
### LP-008: CSV Import/Export — Status:** ✅ Complete
### LP-009: Deduplication — Status:** ✅ Complete
### LP-010: Campaign Membership — Status:** ✅ Complete
### LP-011: Discovery Provider Interface — Status:** ⬜

---

## Milestone 3 — Qualification & Outreach (P0)

### LP-012: Qualification Engine — Status:** ✅ Complete
### LP-013: AI Provider Abstraction — Status:** ✅ Complete
### LP-014: Prompt Templates — Status:** ✅ Complete
### LP-015: Outreach Studio — Status:** ✅ Complete
### LP-016: Activity Logging — Status:** ✅ Complete
### LP-017: Follow-up Tasks — Status:** ✅ Complete

---

## Milestone 4 — SaaS Readiness (P1)

### LP-018: Dashboard & Usage — Status:** ✅ Complete
### LP-019: Suppression & Privacy — Status:** ✅ Complete
### LP-020: Audit & Logging — Status:** ✅ Complete
### LP-021: Team Management — Status:** ✅ Complete
### LP-022: End-to-End Tests — Status:** ⬜
### LP-023: Deployment Docs — Status:** ✅ Complete

---

## Risks

| Risk | Mitigation |
|------|-----------|
| PowerShell execution policy | Per-process bypass |
| Ollama not installed | Template fallback always works |
| No email service | Log reset token; document requirement |
| External lead providers paid | CSV/manual always works without credentials |

## MVP Done When

LP-001 through LP-017 complete + LP-018 dashboard + LP-022 first vertical slice E2E pass.
