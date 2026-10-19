# GCC Atlas — Technical Architecture (Phase 3)

Status: implemented and verified (lint/typecheck/unit tests/build/smoke-test all green).

## 1. System overview

```
┌─────────────────────────────┐      /api proxy (vite dev)
│  Frontend  React 19 + TS    │──────────────────────────────┐
│  Vite 7 · Tailwind v4       │                              ▼
│  TanStack Query · axios     │               ┌──────────────────────────┐
└─────────────────────────────┘               │  Backend  Node 20 + TS   │
                                              │  Express 5 · Zod         │
        research/ + product/                  │  middleware: CORS, JSON, │
        (Phase 1 + 2 artifacts)               │  request logger          │
                                              │  services: deterministic │
                                              │  cited assistant         │
                                              │  repositories (typed SQL)│
                                              └────────────┬─────────────┘
                                                           │ sqlite (promise API)
                                                           ▼
                                              ┌──────────────────────────┐
                                              │  SQLite  data/gcc-atlas.db│
                                              │  schema.sql + seed.ts    │
                                              └──────────────────────────┘
```

- **Frontend** (`frontend/`): React 19, TypeScript, Vite 7, Tailwind v4 (via `@tailwindcss/vite`), TanStack Query for data fetching, axios client with a session-key interceptor, Zod schemas validating every API response shape (`src/services/schemas.ts`).
- **Backend** (`backend/`): Express 5, TypeScript (`tsx` dev, `tsc` build), Zod for all inbound validation, Vitest for integration tests, `sqlite`/`sqlite3` for persistence (`better-sqlite3` is unusable in this environment — no MSVC toolchain).
- **Database**: single SQLite file; schema created from `backend/src/db/schema.sql`, seeded deterministically from `backend/src/db/seed.ts` using `backend/src/data/seed-data.ts`.

## 2. Repository layout

```
backend/
  src/
    index.ts                 app factory (createApp), CORS, error envelope, startup
    db/
      database.ts            sqlite wrapper + initializeSchema + newId helpers
      schema.sql             full DDL (tables + indexes)
      seed.ts                idempotent seeder (CLI: npm run seed [-- --reset])
    data/seed-data.ts        provenance-first seed dataset (sources, cities, companies…)
    routes/                  companies, cities, providers, meta, assistant,
                             saved-research, saved-comparisons
    repositories/            typed data access (one file per aggregate)
    services/assistant.ts    deterministic retriever + answer composer + citations
    middleware/request-logger.ts  one-line request log (skipped when NODE_ENV=test)
    utils/env.ts             Zod-validated env (fail-fast) + CORS origin parser
    utils/validation.ts      Zod request schemas + parseOr400 helper
  tests/                     vitest: repositories, api integration, assistant
frontend/
  src/services/client.ts     axios instance + X-Session-Key interceptor
  src/services/schemas.ts    Zod response schemas (tolerant parsing)
  src/pages/                 Dashboard, Explorer, Cities, Providers, Assistant, Sources, Saved
architecture/                this file + api-contract.md
research/ product/           Phase 1 + Phase 2 deliverables (untouched by the app)
```

## 3. Environment configuration (fail-fast)

`backend/src/utils/env.ts` validates variables at startup with Zod and throws
(with a readable issue list) if anything is malformed:

| Variable     | Default                  | Meaning |
|--------------|--------------------------|---------|
| `NODE_ENV`   | `development`            | `development \| test \| production` |
| `PORT`       | `4000`                   | int 1–65535 |
| `DB_PATH`    | `:memory:`               | SQLite file path (`./data/gcc-atlas.db` for real data) |
| `CORS_ORIGIN`| `*`                      | `*` or comma-separated exact origins |
| `AI_API_KEY` | empty → demo mode        | optional; LLM mode only when set (≥8 chars) |
| `AI_BASE_URL`| `https://api.openai.com/v1` | optional OpenAI-compatible endpoint |
| `AI_MODEL`   | `gpt-4o-mini`            | optional model id |

Rules implemented:
- **Empty strings are tolerated for the optional `AI_*` vars** (common when `.env`
  ships blanks) and normalize to `undefined`, i.e. demo mode.
- No fallbacks for genuinely invalid values (`PORT=abc` refuses to boot).
- `backend/.env` is loaded via `dotenv/config` in `src/index.ts` and `src/db/seed.ts`;
  `.env` files are git-ignored and secrets are never committed (verified in the
  quality gate).

## 4. Database schema

Tables (all with `id TEXT PRIMARY KEY`, `created_at`/`updated_at`):

| Table | Phase 3 changes |
|---|---|
| `companies` | unchanged (is_demo_data flag drives the "tracked dataset" disclosure) |
| `company_locations` | office provenance link to `source_records` |
| `sectors`, `locations` | reference tables |
| **`source_records`** | renamed from `sources`; added `publisher` + `confidence_level` (`high\|medium\|low`); every claim links here |
| `announcements` | `is_verified` flag, FK to `source_records` |
| **`service_providers`** | renamed from `providers`; removed JSON `capabilities` column |
| **`provider_capabilities`** | NEW normalized table (`provider_id`, `capability`, `source_id`) replacing the JSON array; capabilities render with per-item source |
| `city_metrics` | `is_estimate` flag, `confidence_level`, `metric_definition` — keeps "estimate + definition" invariant |
| **`policy_records`** | renamed from `policies`; added `status` CHECK `('draft','finalized','announced','superseded')` and `normalized_benefits` JSON (`{type, band_or_amount, eligibility_threshold, notes}`) for the comparison matrix |
| **`saved_comparisons`** | NEW (`session_key`, `name`, `type`, `location_ids` JSON, `metric_names` JSON, `notes`) |
| `saved_research` | gains `session_key` (user_id kept nullable for future auth) |

Indexes cover the hot paths: lookups by FK (`company_locations.company_id`,
`city_metrics.location_id`, `provider_capabilities.provider_id`, …), list
filters (`companies.operating_status`, `city_metrics.metric_name`,
`source_records.verification_status`, `announcements.announcement_date`,
`saved_research.session_key`, `saved_comparisons.session_key`), and pagination
sorts. `schema.sql` is copied into `dist` at build time
(`scripts/copy-schema.js`) so the production build initializes identically.

## 5. Ownership strategy for saved records (no auth)

Accounts/payments are explicitly banned in v1 (PRD). Saved records therefore
use an **anonymous session key**:

1. The browser generates a uuid once and stores it in
   `localStorage['gcc-atlas-session-key']` (`frontend/src/services/client.ts`).
2. Every request to `/api/saved-research` or `/api/saved-comparisons` carries
   `X-Session-Key` (axios request interceptor; unit-tested).
3. The API validates the key with Zod (`8–64 chars, [A-Za-z0-9_-]`), returns
   **400** when absent/invalid — no silent fallback, never a shadow shared row.
4. **Every query filters by `session_key`** (list, get, update, delete), so each
   browser sees only its own records — enforced by integration tests for both
   resources, including cross-session fetch/mutate → 404.

Migration path: when auth arrives, `session_key` can be backfilled to
`owner_user_id` columns without structural changes.

## 6. API surface and contracts

See **`architecture/api-contract.md`** for the complete reference. Highlights:

- `/api/health` — 200 with `{status, database, mode: demo|llm, version, uptime_seconds}`; 503 `{status: degraded}` when the DB probe fails.
- `/api/companies`, `/api/cities` (+ `/compare`), `/api/providers`, `/api/announcements`, `/api/dashboard/stats`
- `/api/source-records` (GET list/detail; filters: query, `source_type`, `verification_status`, `confidence_level`)
- `/api/policies` (filters: `state`, `status`, `policy_type`, `active_only`) — status-linked, not "active-only" booleans
- `/api/assistant/status`, `/api/assistant/query`
- `/api/saved-research` (CRUD; session key), `/api/saved-comparisons` (list/create/get/delete; session key)
- Resource naming: DB tables use `source_records`/`policy_records`/`service_providers`; API paths use `/source-records`, `/policies`, `/providers` (documented mapping).
- Consistent error envelope: `{ error: { code, message, details? } }` with codes `validation_error` (400), `not_found` (404), `internal_error` (500).

## 7. Provenance & determinism invariants

- Every metric row carries `source_id`, `is_estimate`, `metric_definition`, `confidence_level`; the frontend shows "not yet tracked" rather than a zero when data is missing.
- Policy rows carry `status` so the compare view never presents a **draft** number as a final commitment; conflicts are rendered side-by-side instead of silently selecting one figure.
- Assistant answers are deterministic retellings of the retrieved dataset (`src/services/assistant.ts`); citations reference `source_records` URLs. An optional LLM layer (`AI_API_KEY`) may rephrase but the demo mode is default and labelled.

## 8. Quality gates (verified)

| Gate | Command | Result |
|---|---|---|
| Backend typecheck | `npm run typecheck` (in `backend`) | clean |
| Backend lint | `npm run lint` (oxlint) | 0 warnings, 0 errors |
| Backend tests | `npm run test` | 41 passed |
| Backend build | `npm run build` | tsc + schema copy OK |
| Seed from clean checkout | `rm data/gcc-atlas.db && npm run seed` | idempotent reseed verified |
| Frontend typecheck | `npm run typecheck` (in `frontend`) | clean |
| Frontend lint | `npm run lint` (oxlint) | 0 errors (1 pre-existing warning) |
| Frontend build | `npm run build` | OK (chunk-size warning pending code-split) |
| Live smoke test | `GET /api/health`, `/api/policies?status=finalized`, `/api/source-records?confidence_level=high`, provider list with capability objects, saved-comparisons CRUD + session-isolation | verified |
| Secrets hygiene | `.gitignore` covers `.env*`, `data/*.db` | verified |

## 9. Known limitations / next steps

- 918 KB combined JS chunk——deferred intentional; code-split the dashboard and provider pages when deployment is cut.
- Deployment to a public URL still pending (target/host to be confirmed).
- `gcc-atlas.com` name collision discovered in Phase 1 (research/source S38) — rename/trademark gate before public launch.
