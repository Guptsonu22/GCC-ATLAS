# GCC Atlas

Research-backed directory + decision tool for Global Capability Centre (GCC)
locations in India. **Phase 3: technical architecture & foundation** — a
working React/TypeScript frontend, a Node/TypeScript API with provenance on
every figure, and a seeded SQLite dataset.

> Product artifacts live in `product/`, research registers in `research/`,
> architecture docs in [`architecture/architecture.md`](architecture/architecture.md)
> and [`architecture/api-contract.md`](architecture/api-contract.md).

## Stack

- **Frontend**: React 19 + TypeScript + Vite 7, Tailwind v4, TanStack Query, axios, Zod, oxlint
- **Backend**: Node 20 + TypeScript (tsx dev / tsc build), Express 5, Zod, oxlint, Vitest
- **Database**: SQLite (via `sqlite`/`sqlite3` promise wrapper), schema in `backend/src/db/schema.sql`

## Quickstart (Windows/macOS/Linux, Node ≥ 20)

```bash
# 1. Install both apps (one command; installs frontend and backend)
npm run setup

# 2. Configure environment
cp .env.example backend/.env        # then edit backend/.env if needed
# AI_API_KEY is optional — leave empty for deterministic demo assistant mode

# 3. Create + seed the database (SQLite file at backend/data/gcc-atlas.db)
npm run seed

# 4. Run two terminals
npm run dev:api    # http://localhost:4000  (API)
npm run dev:web    # http://localhost:5173  (UI, proxies /api -> 4000)
```

Open **http://localhost:5173**. The first startup also seeds if the DB is empty
(GitHub-clean checkouts work with step 2 → 4 alone).

## Quality gates (all verified)

```bash
npm run test        # backend vitest suite (93 tests)
npm run typecheck   # backend tsc + frontend tsc
npm run lint        # oxlint on both apps
npm run build       # backend tsc+copy schema, frontend vite build
npm run seed        # deterministic SQLite seed (add -- --reset via --prefix runs)
```

## Environment variables (backend/.env)

| Key | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `4000` | API port |
| `DB_PATH` | `:memory:` | SQLite path; use `./data/gcc-atlas.db` for a file |
| `CORS_ORIGIN` | `*` | exact-origin allowlist, comma separated, or `*` for dev |
| `AI_API_KEY` | *(empty)* | optional; empty = deterministic demo assistant |
| `AI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint |
| `AI_MODEL` | `gpt-4o-mini` | LLM model id |
| `AI_TIMEOUT_MS` | `30000` | provider-call abort window (Phase 7) |
| `AI_MAX_TOKENS` | `800` | cap on model answer tokens (clamped 200–1000) |
| `RATE_LIMIT_WINDOW_MS` / `*_MAX` | 15 min / 600 / 40 / 60 | rate-limit tiers (global / analysis / writes) |

`backend/.env` is git-ignored; never commit real keys.

## AI research assistant (Phase 7)

- **Pipeline**: validated question → entity identification (cities + aliases, states, companies, providers, `recent` → 90-day window) → **bounded retrieval** with a citation whitelist built only from retrieved rows → context package → server-side LLM call (strict JSON contract, timeout + token caps) → zod-shaped structured answer → **citation-id validation** (unknown source ids are stripped per fact).
- **Answer format**: direct answer, key findings, comparison table, evidence-backed facts, recommendations clearly separated from facts (`basis` labels them as model/rule judgments), assumptions, missing information & uncertainty, suggested next step.
- **Demo mode**: with no `AI_API_KEY` (or "Force demo mode" on the Assistant page), responses are composed deterministically from the same retrieval — labelled demo, never inventing content. Provider failures with a key configured return `502 {error:{code:'assistant_provider_error', retryable}}` — **never** silently substituted output.
- **Security**: the key never reaches the browser; retrieval treats source text as untrusted data (control characters stripped, bounded); the model cannot execute SQL or code; event beacons and provider errors are logged without user question content (request logging carries method/path/status only).

## Saved records & sessions (no accounts in v1)

Saved comparisons/research use an anonymous `X-Session-Key` header generated
client-side (uuid in `localStorage`). Every read/write is scoped to that key
with automated cross-session isolation tests — see
[architecture/architecture.md §5](architecture/architecture.md).

## Repo layout

```
backend/     Express API, SQLite schema/import pipeline/tests
frontend/    React SPA (provenance-first UI)
product/     Phase 2: PRD, personas, journeys, metrics, roadmap, brief
research/    Phase 1: 40-source register, market analysis, conflict log
architecture/  architecture.md + api-contract.md (Phase 3 docs)
data/        data-dictionary.md + collection-methodology.md (Phase 5)
```

## Data pipeline (Phase 5)

```bash
npm run seed              # validate-first import of the curated dataset (349 rows)
npm run seed -- --check   # validate only, exit 1 on any data-quality error
```

- Quality rules enforced in `backend/src/data/quality.ts` (URL integrity, GCC-evidence typing,
  identity-collision detection, metric unit/period registry, policy expiry consistency,
  demonstrative labeling, conflict notes, stale-evidence dates).
- Import is rerun-safe: upserts by stable ids, never duplicates, never touches user-saved data.
- Evidence explorer: every source record exposes what cites it (`GET /api/source-records/:id`
  → `usage`), rendered on the Sources page.
- Definitions for tracked/verified/awaiting/stale/conflicting live in `data/data-dictionary.md`.

## Known limitations

- Assistant demo mode is deterministic (dataset answers, no external calls).
- Provider rankings are deliberately not implemented: no defensible ratings methodology or
  supporting data exists yet, so the directory offers evidence-backed filters instead.
- Rate limiting uses per-process memory store (single instance only); swap in a shared
  store before horizontal scaling (`backend/src/middleware/rate-limit.ts`).
- Event analytics store only a truncated hash of session keys — no cross-session identity.
- 960 kB React chunk pending code-split before production deploy.
- Product name collision flagged in Phase 1 (`gcc-atlas.com`) — trademark/rename gate pre-launch.
- Saved rows store `location_ids` as a JSON-encoded string (documented in `architecture/api-contract.md`).
