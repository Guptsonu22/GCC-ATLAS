# GCC Atlas — Product Brief (one page)

**Working title:** GCC Atlas *(pre-alpha; gcc-atlas.com name-collision flag — **S38** — rename/trademark check is a Phase-3 launch gate)*

---

### What we build
A **free, provenance-first city-comparison tool for India GCC expansion decisions**: pick a function and constraints (tier, headcount), get ranked city cards (talent, GCC presence, rent index, policy posture), open a side-by-side 2–4 city comparison with a **normalized state policy incentive matrix**, and click any number → its source record. Every figure carries source, verification date, confidence, and counting denominator ("2,117 GCCs = parent firms; 3,728 = delivery units" — Nasscom–Zinnov FY2026, **S02**). Missing data renders "not yet tracked," never zero; conflicting public figures (e.g., $98.4B vs $164B FY2026 revenue, **S02 vs S04**) always render in labeled pairs. A deterministic AI assistant answers market questions only from cited local records — declining when evidence is insufficient.

### For whom
**Primary persona — Priya, location-strategy lead on an MNC expansion team** (corporate development / India initiative), the analyst who assembles the city shortlist and must defend it to CFO + consultants. *(She and her peers generated ~37–45% of recent India office absorption — **S20–S24** — and this buyer class already pays $3,500–$10,000/seat for adjacent GCC-data products — **S30**.)*
**Served-not-designed:** state IPAs and ecosystem providers (distribution catalysts; monetization only under strict neutrality rules, business-model §4–§5).

### Why now
- **The decision problem is airborne:** GCCs took 39% of India's record 2025 office leasing, forecast 35–40% again in 2026 (**S20–S24**); mandates to expand/launch keep the trigger alive.
- **The data problem is real and public:** 8+ state policies in 8 formats with mutually-incompatible definitions (**S05–S19**); national counts disagree across credible publishers (**S02 vs S08 vs S04**); specialists' directory (GCC Explorer, **S30–S32**) sells reach but nobody offers a neutral, cited *city-decision layer*.
- **The wedge is credible for a prototype:** provenance discipline + normalization is a data-curation problem our build solves; chasing GCC Explorer's 1,680-company breadth is not.

### Job to be done
When a parent mandates a new/expanded India capability centre, shortlist defensible cities — talent, cost, policy incentives, peer presence — and produce an evidence-backed comparison in one working session instead of weeks of PDF assembly and definitional guesswork.

### What ships in the prototype (Phase 2)
Dashboard (headline grid with denominator captions + verified announcements) · City Explorer + 4-city compare with per-cell provenance chips · normalized policy matrix with `final/draft` status and eligibility thresholds (TN 30/20/10 payroll band, UP's ₹20,000/fresher, Gujarat's ₹50–60K/fresher caps, Kerala visibly draft — **S06, S10, S11, S13, S16**) · lean sourced company directory as peer evidence · AI assistant (deterministic, cited, refuse-on-thin-evidence) · Sources page + zero-source lint gate · saved/share comparisons (anonymous) · anonymous event instrumentation enabling success-metrics (time-to-answer, evidence %, search→detail conversion, compare create/reuse, freshness/completeness, retention + fake-door interest) · deployment to a public URL. *(One labeled "planned pricing" probe only — no real checkout.)*

### What we deliberately do NOT build yet (and why)
- **Jobs/watchlists & alerts** — strongest competitor tier already sells exactly this (**S30/S32**); needs continuous ingestion we can't credibly sustain. *Re-enters post-Phase-3 if interviews favor the pivot.*
- **Compensation bands** — multi-source premium (8–40%, **S25–S29**) is great evidence, licensing/access is the bottleneck. Phase 3/4.
- **Accounts, teams, workspaces, payments** — no demand evidence yet; anonymity protects trust-seeking usage. Pre-committed lanes exist (business-model §3) behind behavior gates (T1) + fake-door (T2).
- **Provider lead-gen / paid ranking** — conflicts with the neutrality that IS the product. Pre-committed rules before any provider revenue (business-model §4–§5).
- **Global (non-India) breadth** — out of scope; owned by others (**S38**); India-depth + provenance is the defensible lane.

### Why users would switch to us
Consultants are authoritative but slow/expensive (**S01/S24**); free directories are thin or inconsistent (GCC Village's mismatched rows, **S35**); GCC Explorer is broad, paid, and contact/watchlist-shaped. We win the *pre-work session*: free, session-fast, definition-clean, one-click auditable — and lose gracefully wherever leads, contacts, watchlists, or bespoke modeling are the real job.

### Success at gate
Phase-2 exit when: all six surfaces run end-to-end · seed linter green · assistant cites-or-declines · instrumentation live · public URL deployed · every claim traceable to `research/source-register.csv`. No invented users, no fabricated baselines — proposed targets only, tagged **[proposal]** in `success-metrics.md`.
