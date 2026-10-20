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
npm run test        # backend vitest suite (41 tests)
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

`backend/.env` is git-ignored; never commit real keys.

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
- 960 kB React chunk pending code-split before production deploy.
- Product name collision flagged in Phase 1 (`gcc-atlas.com`) — trademark/rename gate pre-launch.
- Saved rows store `location_ids` as a JSON-encoded string (documented in `architecture/api-contract.md`).
