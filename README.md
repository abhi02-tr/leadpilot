# LeadPilot 🧭

> **AI-Assisted Lead Acceleration & Outreach Engine for Modern Growth Teams**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F.svg?style=flat-square)](https://orm.drizzle.team/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 📌 Overview

**LeadPilot** turns cold, messy lead databases into an organized, high-converting outbound pipeline. It combines **deterministic ICP (Ideal Customer Profile) scoring**, **fact-verified multi-channel outreach generation**, and **follow-up task tracking** into an enterprise-ready, multi-tenant workspace.

Unlike generic AI wrappers that hallucinate company metrics and promises, LeadPilot's inference engine strictly evaluates **verified evidence** (validated domain, active contact, location match, niche fit) and drafts personalized outreach with zero fabricated claims.

---

## ✨ Key Features

### 1. 🎯 Deterministic Qualification Engine (0–100 ICP Scoring)
- Scores accounts against configurable campaign ICP rules (Website status, decision-maker verification, niche fit, location alignment, reputation signals).
- Transparent signal breakdown with point-by-point reasoning.
- Clear distinction between estimated qualification score and conversion probability.

### 2. ⚡ AI Outreach Studio
- **Multi-Channel:** Generates targeted pitch drafts for **Email**, **WhatsApp**, and **Instagram**.
- **Multi-Lingual:** Composes messages in **English**, **Hindi**, **Gujarati**, and **Hinglish**.
- **Tone & Length Control:** Choose from Consultative, Conversational, Professional, Friendly, or Direct styles across Short, Standard, and Detailed lengths.
- **Provider Cascade:** Ships with a deterministic **Template Engine** that requires **zero third-party API keys**, with seamless local **Ollama (LLaMA 3.2)** fallback.
- **Explicit Dispatch Flow:** Clear distinction between message drafting, clipboard copying, and verified sending (`Copy ≠ Sent`).

### 3. 🏢 Multi-Tenant Architecture & RBAC
- Complete data isolation per workspace using strict `workspace_id` guards and foreign key cascading.
- Role-Based Access Control matrix: `Owner` > `Admin` > `Member` > `Viewer`.
- Secure session management backed by PostgreSQL (`connect-pg-simple`) and timing-attack-resistant **Argon2id** password hashing.

### 4. 📥 CSV Ingestion & Deduplication
- Batch upload target accounts with automatic deduplication by normalized domain and company name.
- Automatic extraction and verification of primary emails and phone numbers.
- One-click CSV export with custom filtering.

### 5. 🗓️ Follow-up & Task Automation
- Scheduled task inbox filtered by **Today**, **Overdue**, **Upcoming**, and **Completed**.
- Idempotent task completion and cancellation with full activity audit logging.

### 6. 🛡️ Privacy & Compliance
- Integrated **Do-Not-Contact (DNC) / Suppression** enforcement.
- Per-workspace daily AI generation limits and endpoint-specific rate limiting.

---

## 🏗️ Monorepo Structure

```text
lead-manager/
├── apps/
│   ├── api/                    # Express backend (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── db/             # Drizzle ORM schema, migrations, and seed script
│   │   │   ├── middleware/     # Auth, Workspace, Request ID, Zod validation
│   │   │   ├── modules/        # Domain services: auth, campaigns, leads, outreach, followups, qualification, analytics
│   │   │   └── providers/ai/   # Template & Ollama AI providers and cascade registry
│   │   └── package.json
│   │
│   └── web/                    # React frontend (Vite + TypeScript + Tailwind)
│       ├── src/
│       │   ├── components/     # AppLayout, AuthGuard, navigation shell
│       │   ├── context/        # Auth & workspace state management
│       │   ├── lib/            # Axios client with interceptors
│       │   └── pages/          # Dashboard, Leads, Lead Detail, Campaigns, Outreach Studio, Follow-ups, Settings
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared TypeScript interfaces & Zod validation schemas
│       ├── src/index.ts
│       └── package.json
│
├── docs/                       # PRD, Architecture blueprint, and Implementation plan
├── docker-compose.yml          # Isolated PostgreSQL 16 container definition (Port 5433)
├── .env.example                # Environment variables template
└── package.json                # NPM workspaces configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** `>= 20.0.0`
- **npm:** `>= 10.0.0`
- **Docker & Docker Compose** (for running the isolated PostgreSQL database)

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/abhi02-tr/leadpilot.git
cd leadpilot
```

#### 2. Install workspace dependencies
```bash
npm install
```

#### 3. Configure environment variables
Create a `.env` file in the root directory (you can copy `.env.example`):
```bash
cp .env.example .env
```

Generate secure secrets for sessions and encryption:
```bash
node -e "const crypto = require('crypto'); console.log('SESSION_SECRET=' + crypto.randomBytes(64).toString('hex')); console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));"
```

Update your `.env` file with:
```env
NODE_ENV=development
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
PORT=3001

# PostgreSQL connection (maps to port 5433 on host)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/leadpilot

# Paste generated keys
SESSION_SECRET=<YOUR_GENERATED_SESSION_SECRET>
ENCRYPTION_KEY=<YOUR_GENERATED_32_BYTE_HEX_KEY>

AI_DEFAULT_PROVIDER=template
MAX_IMPORT_ROWS=1000
MAX_AI_GENERATIONS_PER_DAY=50
```

#### 4. Start the PostgreSQL container
Launch the dedicated PostgreSQL 16 service on port 5433:
```bash
docker compose up -d
```

#### 5. Apply database migrations & seed demo data
```bash
# Apply all 19 database tables & indexes
npm run db:migrate

# Seed demo user, workspace, campaigns, leads, and outreach messages
npm run db:seed
```

#### 6. Run the applications in development mode
Start both the backend API and frontend dev server concurrently:
```bash
# Starts API on :3001 and Web client on :3000
npm run dev
```

Or run them individually:
```bash
# Run API server only
npm run dev --workspace=apps/api

# Run Web client only
npm run dev --workspace=apps/web
```

---

## 🔑 Demo Credentials

A pre-configured demo account is included out of the box:

| Parameter | Value |
| :--- | :--- |
| **URL** | [http://localhost:3000/login](http://localhost:3000/login) |
| **Email** | `demo@leadpilot.com` |
| **Password** | `Password123!` |
| **Default Workspace** | *LeadPilot Growth Labs* |

> 💡 **Tip:** On the login page, you can click the **"Auto-fill"** button to instantly populate the credentials.

---

## 🛠️ Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **Start Dev** | `npm run dev` | Runs backend API and frontend dev server concurrently |
| **Build Web** | `npm run build --workspace=apps/web` | Compiles the production frontend bundle (`dist/`) |
| **Typecheck** | `npm run typecheck` | Runs TypeScript type checking across all packages |
| **Run Tests** | `npm run test` | Executes Vitest unit tests (crypto, AI providers, schemas) |
| **Migrations** | `npm run db:migrate` | Runs Drizzle migrations on the PostgreSQL instance |
| **Seed** | `npm run db:seed` | Populates the database with realistic sample data |
| **Drizzle Studio** | `npm run db:studio` | Launches visual Drizzle database browser |

---

## 📡 REST API Reference

All API routes are served under `/api/v1` and authenticated via session cookies:

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/v1/auth/register` | `POST` | Register user and initialize new workspace |
| `/api/v1/auth/login` | `POST` | Authenticate user with rate limiting |
| `/api/v1/auth/logout` | `POST` | Invalidate active user session |
| `/api/v1/me` | `GET` | Get current user profile and workspaces |
| `/api/v1/dashboard/summary` | `GET` | Retrieve pipeline metrics, KPI counts, and activities |
| `/api/v1/leads` | `GET` | Filter and paginate workspace leads |
| `/api/v1/leads` | `POST` | Create a new lead record |
| `/api/v1/leads/:id` | `GET` | Get lead details, status, and score |
| `/api/v1/leads/:id/qualification`| `POST`| Run deterministic 0–100 ICP qualification engine |
| `/api/v1/leads/import/csv` | `POST` | Batch import leads with deduplication |
| `/api/v1/leads/export/csv` | `GET` | Stream CSV export of matching leads |
| `/api/v1/campaigns` | `GET / POST` | List or create ICP campaigns |
| `/api/v1/ai/generate-outreach` | `POST` | Generate fact-verified multi-channel outreach draft |
| `/api/v1/outreach/messages/:id/copy-log` | `POST` | Log clipboard copy event |
| `/api/v1/outreach/messages/:id/mark-sent` | `POST` | Explicitly record message dispatch |
| `/api/v1/follow-ups` | `GET / POST` | List tasks (today/overdue/upcoming) or schedule new |
| `/api/v1/follow-ups/:id/complete` | `POST` | Mark follow-up task as completed |

---

## 🧪 Testing

LeadPilot includes comprehensive test suites covering crypto normalization, password security, AI inference templates, and validation schemas:

```bash
npm run test --workspace=apps/api
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
