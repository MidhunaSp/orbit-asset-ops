# Orbit Asset Intelligence — starter build

A real, working full-stack asset/inventory intelligence app: role-based
dashboard, maker-checker approvals, anomaly tracking, and an AI insights
endpoint with graceful degradation. Matches the reference the dashboard design
(sidebar nav, live stats, distribution/top-items charts).

**Stack:** React 19 + TypeScript + Tailwind (frontend) · Express 5 + TypeScript
(backend) · Drizzle ORM · SQLite for local dev, PostgreSQL/Neon-ready for
production · optional Azure OpenAI for the AI insights route.

> Note: this uses **Drizzle ORM** rather than Prisma. Functionally
> equivalent, but the environment this was built in couldn't reach
> Prisma's binary-download server, so Drizzle (pure TS/JS, no native
> engine binaries) was used instead — and it's a fine production choice.

## What's actually implemented right now

- JWT auth + role-based middleware (Employee / Manager / L2 Support / Executive / Admin)
- 5 one-click demo logins (matching the "5 demo roles" from the reference)
- **All 9 pages built and wired to live data**, sharing one layout/sidebar with working navigation:
  - **Dashboard** — live stats, distribution/top-items charts
  - **Approval Workbench** — submit requests, decide them (Manager/Admin/Executive), maker-checker enforced
  - **Anomalies** — view active/resolved, resolve them (L2 Support/Manager/Admin)
  - **Stock Master** — current catalog, add new stock items (Manager/Admin)
  - **Stock Ledger** — per-item distribution history
  - **Distributions** — distribute stock (auto-decrements Stock Master quantity), full history
  - **Reconciliation** — a real integrity check (flags assets marked IN_USE with no assigned user) + the audit trail
  - **Asset Registry** — all assets, register new ones (Manager/Admin)
  - **Asset Requests** — filtered view of Approval Workbench scoped to asset-related requests
- **True maker-checker**: a requester can never approve their own request —
  enforced server-side, tested and verified (see below)
- Audit log on every approval/anomaly/asset/stock/distribution action
- AI insights endpoint that calls Azure OpenAI if configured, and
  **degrades gracefully to a rule-based summary if it isn't** (no crash)

Role-based UI: buttons for approving, resolving, and creating only appear for
roles that are actually allowed to do those things — but it's not just
cosmetic, the backend rejects the action too if you try to bypass the UI.

## Role responsibilities

This is the exact permission mapping enforced by `requireRole(...)` on the
backend routes — not just a UI convention, it's checked server-side on
every request.

| Role | Submit requests | Approve/reject requests | Resolve anomalies | Add stock/assets/distributions | View everything |
|---|---|---|---|---|---|
| **Employee** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **L2 Support** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Executive** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

On top of this table, **maker-checker still applies**: even a role that can
approve/reject can never approve their own request — it has to be a
different person with that role (or higher).

This mapping was a design choice made for this build, not something pulled
from an external spec — change the `requireRole(...)` calls in the relevant
route files if you want different responsibilities per role.

## Running it locally

### Backend
```bash
cd backend
npm install
npm run db:migrate   # creates dev.db and applies schema
npm run seed          # seeds demo users, stock, assets, approvals, anomalies
npm run dev           # starts API on http://localhost:4000
```

Demo logins (password `password123` for all):
- employee@demo.io
- manager@demo.io
- l2support@demo.io
- executive@demo.io
- admin@demo.io

### Frontend
```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:5173
```

Open http://localhost:5173, pick a demo role, and you'll land on the live
dashboard.

## Deploying to Azure (matching the original stack)

**Database — Neon (PostgreSQL):**
1. Create a Neon project, copy the connection string.
2. In `backend/src/db/`, swap `schema.ts` → use `schema.postgres.ts`, and
   `client.ts` → use `client.postgres.ts` (these are provided, ready to go).
3. Set `DATABASE_URL` to the Neon connection string.
4. `npx drizzle-kit generate && npx drizzle-kit migrate`

**Backend — Azure App Service:**
1. `npm run build` in `backend/`, deploy the `dist/` folder + `package.json`.
2. Set env vars in App Service configuration: `DATABASE_URL`, `JWT_SECRET`,
   `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_KEY`.

**Frontend — Azure Static Web Apps:**
1. Set `VITE_API_BASE` to your deployed backend URL.
2. `npm run build` in `frontend/`, deploy the `dist/` folder via the Azure
   Static Web Apps CLI or GitHub Actions workflow (Azure generates this
   automatically when you connect a repo).

**AI agents (Azure OpenAI):**
Set `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` in the backend `.env`.
Without them, `/api/ai/insights` still works — it just returns a direct
data summary instead of an LLM-generated one (this is the graceful
degradation behavior, not a bug).

## Verified working (tested during build)

- ✅ `POST /api/auth/demo-login` returns a valid JWT for each role
- ✅ `GET /api/dashboard/stats` returns live counts from the database
- ✅ Maker-checker: an employee attempting to approve their own request is
  rejected (403); a manager approving a *different* employee's request
  succeeds and updates the DB
- ✅ Frontend builds cleanly with `tsc -b && vite build`
- ✅ Frontend (built, served via `vite preview`) successfully calls the
  live backend and renders real numbers
