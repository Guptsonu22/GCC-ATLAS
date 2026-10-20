# GCC Atlas — Deployment Guide

Status: **no deployment was performed** — no hosting credentials (Render/Vercel/Railway/Fly/Heroku/DO tokens) were available in this environment at review time. Per instructions, this guide contains the **exact, ready-to-run runbooks** below instead of a claimed URL. Nothing here assumes access to any local machine; the commands assume a fresh checkout.

Two runbooks are primary (Render, Railway); a Fly.io appendix is included for completeness. Both primary paths support persistent SQLite storage for the free/low tiers, per-request CORS allowlists, and a configured health check.

---

## 1. Architecture to deploy

```
Browser → Static frontend (Vite build: /explorer /cities /compare /providers /assistant /sources /saved)
       → HTTPS API calls to deployed backend → Express 5 + SQLite (file DB) → seeded from backend/src/db/schema.sql + seed-data
```

- Backend: Node ≥ 20, Express 5, `sqlite3`/`sqlite` drivers. Builds with `tsc` → `dist/`; schema + seed auto-initialize on first boot (`ensureSeeded()` in `backend/src/db/database.ts` — there is **no separate migration step**: schema.sql is executed from `dist/db/schema.sql`; idempotent seed inserts only when tables are empty; re-running with an existing DB is a no-op).
- Frontend: Vite/React build → static assets; API base URL is build-time configurable via `VITE_API_BASE_URL` (see §3).

## 2. Production environment variables (backend)

| Variable | Production value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | enables production warnings + request logging; keeps rate limiting on |
| `PORT` | provider-assigned / `4000` | backend listens on this |
| `DB_PATH` | `/data/gcc-atlas.db` (Render disk mount) or persistent volume path | MUST be a mounted persistent disk, not the ephemeral container FS |
| `CORS_ORIGIN` | `https://<your-frontend-host>` | exact allowlist, comma-separated for multiple; omitting it returns wide-open `*` CORS with a **boot warning** |
| `AI_API_KEY` | optional provider secret | set via provider's secret manager (never committed); empty = deterministic demo assistant |
| `AI_BASE_URL` / `AI_MODEL` / `AI_TIMEOUT_MS` / `AI_MAX_TOKENS` | as available (optional) | LLM tuning; safe defaults documented in `backend/.env.example` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_GLOBAL_MAX` / `RATE_LIMIT_ANALYSIS_MAX` / `RATE_LIMIT_WRITES_MAX` | defaults fine | 15 min / 600 / 40 / 60 |

Secrets policy: `AI_API_KEY` (or any provider key) is set only in the hosting dashboard's encrypted env store. The repo never contains real keys (`backend/.env` is git-ignored; `.env.example` carries placeholders only).

## 3. Frontend production configuration

Build-time env:
- `VITE_API_BASE_URL=https://<your-backend-host>/api` — the axios `baseURL` fallback used by the browser (relative `/api` only works when API and UI are same-origin, e.g. behind one reverse proxy).

Build & preview locally before deploy:
```bash
cd frontend
VITE_API_BASE_URL=https://your-backend-host/api npm run build   # → frontend/dist
```

## 4. Runbook A — Render (recommended; single dashboard)

**Backend (Web Service):**
1. New → Web Service → connect the repo; root dir `backend`.
2. Build command: `npm ci && npm run build`; Start command: `npm start` (package.json start = `node dist/index.js`).
3. Add **Disk**: mount path `/data`, size ≥ 1 GB; env `DB_PATH=/data/gcc-atlas.db`.
4. Env vars: as in §2 (`NODE_ENV=production`, `CORS_ORIGIN=https://<frontend-host>.onrender.com`).
5. Health check path: `/api/health` (returns `{status:'ok', db:'connected'}`; used as the platform's health probe).
6. Logs: Render dashboard → service → Logs tab (the app also logs one structured line per request: `[gcc-atlas-api] GET /api/... 200 12ms`).

**Frontend (Static Site):**
1. New → Static Site → connect repo; root dir `frontend`.
2. Build command: `npm ci && npm run build`; publish dir: `dist`.
3. Env var (secret-file-free, build-time): `VITE_API_BASE_URL=https://<backend-host>.onrender.com/api`.
4. SPA routing fallback: Render "Static Site" uses rewrite rules — add `/*  -> /index.html  200` so `/explorer`, `/cities`, etc. deep links reload correctly.
5. After both services exist, set the backend's `CORS_ORIGIN` to the frontend's final URL and redeploy the backend once.

**Database initialization (first boot):** the backend runs `ensureSeeded()` at startup — creates tables from `schema.sql` and seeds the tracked dataset (46 companies, 12 locations, 36 sources, policies, providers, announcements) when the DB is empty. No manual migration command is needed. To force a re-seed, redeploy with a cleared disk (`--reset` seed flag is available via `npm run seed -- --reset` locally).

**Blueprint alternative (one-click):** a `render.yaml` description is provided at `deployment/render.yaml` (backend web service + frontend static site + disk). `New → Blueprint → repo` uses it directly.

## 5. Runbook B — Railway (single project, two services + volume)

1. `railway init` → then `railway add --service node` ×2 (or from the dashboard):
   - **api**: Root `backend`; Start `node dist/index.js`; build `npm ci && npm run build`; add **Volume** `/data` (persistent object); variables per §2.
   - **web**: Root `frontend`; Build `npm run build` with `VITE_API_BASE_URL=https://<railway-backend-domain>/api`; Serve dir `dist` (SPA fallback = standard in Railway's static serving config `nixpacks.toml`/`serve.json`).
2. Add both domains from project settings; set `CORS_ORIGIN` to the web domain; redeploy api.
3. Health check: point Railway's healthcheck path at `/api/health`.
4. Logs: `railway logs -s api` or dashboard Logs tab.

## 6. Appendix — Fly.io
- `fly launch --no-deploy` twice (api with `fly volumes create gccdata --size 1` mounted at `/data`; static web via `fly static` or a plain machine serving `dist`); `fly secrets set AI_API_KEY=…`; `fly deploy`. Same env table applies.

## 7. Post-deployment verification checklist (run against the PUBLIC URL)

```bash
# 1. health
curl -s https://<api-host>/api/health
# 2. dashboard real data (should show total_companies=46)
curl -s https://<api-host>/api/dashboard/stats
# 3. assistant demo answer + citations resolve
curl -s -X POST https://<api-host>/api/assistant/query -H "Content-Type: application/json" \
  -d '{"query":"Which city should a 150-person engineering GCC consider first: Hyderabad or Pune?"}'
# 4. CORS: echo header must be the allowlisted origin only
curl -s -I -H "Origin: https://<frontend-host>" https://<api-host>/api/companies | grep -i access-control-allow-origin
# 5. sessions isolate cross-browser (expect 404 for random key reads of existing ids)
# 6. browser: open the frontend, run the demo walkthrough (deployment/demo-walkthrough.md)
```

Repeat the critical journeys (Phase 8 report §2) verbatim against the deployed URLs and record results in the final delivery notes. **This checklist has NOT been executed against a live deployment, because no credentials were available — do not assume a verified public URL until these probes pass.**

## 8. Failure modes & honest notes

- **Free-tier ephemerality**: if `DB_PATH` is not on a mounted disk, writes (saved research) vanish on redeploy — the backend deliberately warns about this at boot.
- **First byte latency**: Render free tier idles services; first request may take ~30–50 s to wake. Mention on the reviewer landing page.
- **Rate limits**: analysis endpoints allow 40 requests / 15 min per IP — the demo walkthrough is comfortably below this; pairing reviewers sharing one office IP could trip the limit (wait 15 min or bump `RATE_LIMIT_ANALYSIS_MAX`).
- **Assistant mode without key**: the public demo intentionally runs in deterministic demo mode; setting `AI_API_KEY` in the hosting dashboard switches to LLM mode with no code changes.
- **Name collision**: gcc-atlas.com exists (S38) — as a public Flexiple artifact, carry the "working title / pre-alpha" label from positioning.md and do not run ads with this name pending a trademark check.
