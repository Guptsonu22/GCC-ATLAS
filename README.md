# GCC Atlas

Research-backed directory, decision engine, and location intelligence tool for Global Capability Centre (GCC) locations in India.

Built as the capstone submission for the **Flexiple Product Intern Assignment**, GCC Atlas bridges the critical information asymmetry in India's GCC ecosystem by delivering a provenance-first platform where every metric, rent figure, and policy incentive carries explicit counting denominators and source verification trails.

### 🌐 Live Production Deployments
- **Live Web Application (Vercel):** [https://gcc-atlas-kohl.vercel.app](https://gcc-atlas-kohl.vercel.app)
- **Live Production API (Render):** [https://gcc-atlas-j88x.onrender.com/api](https://gcc-atlas-j88x.onrender.com/api)
- **API Health Probe:** [https://gcc-atlas-j88x.onrender.com/api/health](https://gcc-atlas-j88x.onrender.com/api/health)
- **Final Strategy Deck (PDF):** [`submission/GCC-Atlas-Strategy-Deck-Final.pdf`](submission/GCC-Atlas-Strategy-Deck-Final.pdf)
- **Final Strategy Deck (PPTX):** [`submission/GCC-Atlas-Strategy-Deck-Final.pptx`](submission/GCC-Atlas-Strategy-Deck-Final.pptx)

---

## 1. Product Overview

India's GCC ecosystem is expanding rapidly (2,117 parent GCCs, $98.4B revenue, 39% of commercial office absorption), yet leadership teams planning expansions face fragmented, un-normalized data:
- **Scattered Policy Incentives:** 8+ state governments publish GCC incentive policies in disparate, non-standard document formats.
- **Conflicting Counting Regimes:** Market statistics frequently conflate parent organizations with individual delivery units without citation.
- **Expensive Advisory Cycles:** Location shortlisting typically requires 3–6 weeks of expensive consulting advisory.

**GCC Atlas provides a self-serve decision layer:**
1. **Side-by-Side City Comparison:** Normalized metrics (rents, talent, operating costs) with explicit `EST` flags and definitions.
2. **Normalized State Policy Tracker:** Subsidies, eligibility criteria, and effective dates with clear `draft` vs. `finalized` status indicators.
3. **Peer GCC Footprint:** Vetted directory of operational vs. announced GCCs by function and city.
4. **Cited AI Research Assistant:** Bounded retrieval engine citing only verified database records with strict hallucination-prevention guardrails.
5. **Full Evidence Transparency:** Dedicated Sources Explorer detailing publishers, confidence levels, verification dates, and reverse citations.

---

## 2. Implemented Features

| Feature Module | Capabilities | Status |
|---|---|---|
| **Dashboard** | Ecosystem overview (46 tracked GCCs, 12 cities, 11 sectors), city footprint & sector distribution charts, and real-time Verification Ledger. | **VERIFIED** |
| **GCC Explorer** | Fuzzy text search, multi-faceted filtering (city, sector, operational status), sorting by headcount, pagination, and detailed company profiles with source links. | **VERIFIED** |
| **City Intelligence & Compare** | Side-by-side comparison of 2–4 cities, commercial rent index, talent availability, EST estimate badges, and normalized state policy incentive matrices. | **VERIFIED** |
| **Service Provider Directory** | Neutral directory of ecosystem enablers (real estate, legal, staffing) filterable by capability, free of sponsored rankings. | **VERIFIED** |
| **AI Research Assistant** | Dual-mode assistant (OpenAI LLM or deterministic local demo). Generates structured answers with key findings, comparison tables, and verified citation badges. | **VERIFIED** |
| **Evidence & Sources Explorer** | Complete index of all 36 research sources with publisher, type, confidence rating, verification status, and reverse citation usage. | **VERIFIED** |
| **Saved Research & Persistence** | Anonymous session-scoped persistence (`X-Session-Key`) allowing users to save, retrieve, rename, and delete shortlists without accounts. | **VERIFIED** |

---

## 3. Architecture

```
┌─────────────────────────────────┐               ┌─────────────────────────────────┐
│     Frontend (React 19 SPA)     │   HTTP/REST   │      Backend (Node 20 API)      │
│  Vite 8 · Tailwind v4 · Lucide  │──────────────▶│       Express 5 · Zod           │
│   TanStack Query · Axios · Zod  │◀──────────────│   Rate Limiters · Request Log   │
└─────────────────────────────────┘               └────────────────┬────────────────┘
                                                                   │
                                                                   ▼
                                                  ┌─────────────────────────────────┐
                                                  │       SQLite Database           │
                                                  │    backend/data/gcc-atlas.db    │
                                                  │    Normalized Schema (DDL)      │
                                                  └─────────────────────────────────┘
```

- **Frontend (`frontend/`):** React 19, TypeScript, Vite 8, Tailwind CSS v4, TanStack Query, Axios with session-key request interceptor, and Zod response validation.
- **Backend (`backend/`):** Express 5, TypeScript (`tsx` in dev, `tsc` in build), Zod input validation, Vitest test suites, and parameterized SQLite storage.
- **Database:** SQLite via promise wrapper; schema defined in `backend/src/db/schema.sql`, seeded idempotently via `backend/src/db/seed.ts`.
- **Security:** Strict CORS allowlisting, rate-limiting tiers (global, analysis, writes), sanitized session tokens, and input bounds checking.

---

## 4. Prerequisites

- **Node.js:** Version `20.x` or newer (LTS recommended).
- **npm:** Version `10.x` or newer.
- **Python (Optional for Strategy Deck rebuilding):** Python 3.10+ with `python-pptx` and `reportlab`.
- **OS:** Windows (PowerShell/CMD), macOS, or Linux.

---

## 5. Quickstart & Installation

```bash
# 1. Clone repository and install dependencies for both apps
npm run setup

# 2. Configure environment template
cp .env.example backend/.env
# Note: AI_API_KEY is left empty by default to run in deterministic demo mode.

# 3. Create and seed the SQLite database (349 curated rows)
npm run seed

# 4. Start both development servers concurrently
npm run dev:api    # Terminal 1: Backend API on http://localhost:4000
npm run dev:web    # Terminal 2: Frontend SPA on http://localhost:5173
```

Open **`http://localhost:5173`** in your browser.

---

## 6. Environment Variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Environment mode (`development`, `test`, `production`). |
| `PORT` | `4000` | Port for the Express API server. |
| `DB_PATH` | `./data/gcc-atlas.db` | File path for SQLite database (`:memory:` for tests). |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origins (comma-separated or `*` for dev). |
| `AI_API_KEY` | *(empty)* | Optional OpenAI key. Leave empty for deterministic demo mode. |
| `AI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint. |
| `AI_MODEL` | `gpt-4o-mini` | LLM model identifier. |
| `AI_TIMEOUT_MS` | `30000` | Provider call timeout in milliseconds. |
| `AI_MAX_TOKENS` | `800` | Max tokens for assistant response (clamped 200–1000). |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15-minute sliding rate limit window. |
| `RATE_LIMIT_GLOBAL_MAX` | `600` | Max global requests per window. |
| `RATE_LIMIT_ANALYSIS_MAX` | `40` | Max requests on compute-intensive analysis routes. |
| `RATE_LIMIT_WRITES_MAX` | `60` | Max write requests per window. |

---

## 7. Database Setup & Ingestion

Database creation and seeding are fully automated and idempotent:

```bash
# Run validate-first database import
npm run seed

# Run data quality validation only (exits 1 on any schema violation)
npm run seed -- --check

# Force reset and re-seed from scratch
npm run seed -- --reset
```

The database schema (`backend/src/db/schema.sql`) enforces relational integrity across 12 normalized tables: `locations`, `sectors`, `source_records`, `companies`, `company_locations`, `company_sources`, `city_metrics`, `policy_records`, `announcements`, `service_providers`, `provider_capabilities`, `saved_research`, and `saved_comparisons`.

---

## 8. Quality Gates & Testing

All quality gates are fully automated and verified:

```bash
# Run complete monorepo test suite (108 tests across 9 suites)
npm run test

# Run backend unit & integration tests only (94 tests)
npm run test --prefix backend

# Run frontend smoke & unit tests only (14 tests)
npm run test --prefix frontend

# Typecheck both TypeScript projects
npm run typecheck

# Lint with oxlint across all files (0 errors)
npm run lint

# Compile backend and bundle frontend for production
npm run build
```

---

## 9. AI Configuration & Reliability

The AI Research Assistant is engineered with strict reliability guardrails:
1. **Bounded Retrieval:** The user's query is parsed for recognized entities (cities, sectors, companies, providers). Only records matching the verified dataset are passed into context.
2. **Deterministic Demo Mode:** When `AI_API_KEY` is not provided, the assistant composes structured responses deterministically from the retrieved database records. No external API calls are made and no facts are invented.
3. **Citation Whitelist & Stripping:** The assistant's output is parsed with Zod. Any citation ID referenced in the model response that was not part of the retrieved context package is automatically stripped.
4. **Honest Limitations:** Out-of-scope queries (e.g. asking about cities outside India) return clear, honest disclosures regarding dataset boundaries rather than speculative hallucinations.

---

## 10. Deployment Instructions

GCC Atlas is ready for deployment on platforms with persistent disk support (e.g., Render, Railway, or Fly.io).

### Render Blueprint (Recommended)
The repository includes a ready-to-use [`deployment/render.yaml`](deployment/render.yaml) blueprint:
1. Connect your repository to Render.
2. Deploy via **Blueprints** using `deployment/render.yaml`.
3. The blueprint provisions:
   - **`gcc-atlas-api`:** Express web service with a 1 GB persistent disk mounted at `/data`.
   - **`gcc-atlas-web`:** Static site frontend with SPA rewrite rules (`/*` &rarr; `/index.html`).
4. Set `CORS_ORIGIN` on the backend to the deployed frontend URL and redeploy.

For detailed alternative runbooks (Railway, Docker, Fly.io), consult [`deployment/deployment-guide.md`](deployment/deployment-guide.md).

---

## 11. Data-Source Methodology

- **Research Register:** Every qualitative and quantitative claim is cataloged in [`research/source-register.csv`](research/source-register.csv) with unique IDs (`S01`–`S40`).
- **Counting Disclosures:** National counts are distinguished by definition (e.g. 2,117 parent GCCs vs 3,728 delivery units).
- **Conflict Handling:** Contested figures (e.g. $98.4B Nasscom–Zinnov vs $164B outlier reports) are co-displayed with notes rather than averaged.
- **Verification Statuses:** Records are categorized as `verified`, `unverified`, `stale`, or `conflicting`.

---

## 12. Known Limitations

- **Tracked Sample vs. National Total:** Prototype tracks 46 vetted companies across 14 cities with deep citation trails, rather than attempting to scrape an unverified directory of 2,117 national GCCs.
- **In-Memory Rate Limiter:** Current rate limiting uses an in-process memory store suited for single-instance deployment; migrate to Redis before horizontal scaling.
- **Anonymous Session Persistence:** Saved shortlists use browser `localStorage` UUID keys for privacy without accounts in v1.
- **Bundle Chunk Size:** Frontend bundle is ~978 kB; route-based code-splitting is scheduled for post-v1.

---

## 13. Submission Deliverables

- **Strategy Deck (PPTX):** [`submission/GCC-Atlas-Strategy-Deck.pptx`](submission/GCC-Atlas-Strategy-Deck.pptx) *(also at `product/deck/gcc-atlas-strategy-deck.pptx`)*
- **Strategy Deck (PDF):** [`submission/GCC-Atlas-Strategy-Deck.pdf`](submission/GCC-Atlas-Strategy-Deck.pdf) *(also at `product/deck/gcc-atlas-strategy-deck.pdf`)*
- **Final Audit Report:** [`submission/FINAL-AUDIT.md`](submission/FINAL-AUDIT.md)
- **Submission Checklist:** [`submission/FINAL-CHECKLIST.md`](submission/FINAL-CHECKLIST.md)
- **Reviewer Demo Walkthrough:** [`submission/DEMO-WALKTHROUGH.md`](submission/DEMO-WALKTHROUGH.md)
- **Submission Email Draft:** [`submission/SUBMISSION-EMAIL.md`](submission/SUBMISSION-EMAIL.md)
