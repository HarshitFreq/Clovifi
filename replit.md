# Aero Finance

A personal expense tracker with a Frutiger Aero (2006–2012 glassmorphism) visual theme — sky-blue gradients, frosted glass panels, glossy surfaces.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/finance-tracker run dev` — run the frontend (port 19051)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/` — Drizzle ORM table definitions (accounts, categories, transactions)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/finance-tracker/src/` — React frontend

## Architecture decisions

- Account balance is updated in real-time on each transaction create/update/delete (no separate balance ledger table)
- Transaction type defaults to "expense" (expense-first design)
- Categories are shared (expense/income/both) and optional on transactions (nullable FK with SET NULL on delete)
- Summary endpoints compute aggregates server-side; no client-side aggregation
- Frutiger Aero theme uses CSS custom properties + backdrop-filter for glass effects

## Product

- Dashboard: total balance, monthly expenses vs income, monthly trend chart (Recharts), spending by category
- Transactions: full list with filters by account/category/type/date, add/edit/delete with balance auto-update
- Accounts: manage checking, savings, credit card, cash, investment accounts with color coding
- Categories: custom expense/income categories with colors

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Account balance is mutated on every transaction change — if seeding directly via SQL, set balances manually afterward
- Monthly trend uses JS-computed cutoff date (not SQL INTERVAL) to avoid Drizzle's `sql.raw` INTERVAL syntax issue
- Always re-run codegen after changing `lib/api-spec/openapi.yaml`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
