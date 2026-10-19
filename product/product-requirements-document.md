# GCC Atlas — Product Requirements Document (Phase 2)

*Version 1.0 — 2026-10-19. This PRD is derived from completed Phase 1 research (`research/`). Every product claim traces to a `source-register.csv` ID (e.g., **S30**) or is explicitly marked **[inference]**. Baselines are **not** assumed to exist yet; instrumented metrics carry **proposed targets** only.*

---

## 0. Assignment context

India GCC ecosystem prototype for the Flexiple Product Intern assignment: a working, deployed, interactive product + evidence-backed strategy. Phase 1 (research, problem validation, competitive landscape) is complete and documented. Phase 2 defines what we build — without implementing everything from the original vision.

---

## 1. Opportunity evaluation (why this product shape, and not the others)

Phase 1 tested four plausible starting points. Verdicts, with evidence:

| Starting point | Verdict | Evidence for / against |
|---|---|---|
| **A. GCC company intelligence** (directory-costs-coverage like GCC Explorer) | **Rejected as lead surface.** The concept is already live and monetized: 1,680+ GCCs, 70+ cities, daily updates, $3.5K–$10K per seat (**S30**/**S31**). A 2,117-entity directory built from public sources cannot beat a funded analyst operation on breadth (**S02** vs **S30**). Keep a *lean* company directory as peer-evidence inside the city workflow, not as the product. | Behavioral + economic precedent |
| **B. City/location comparison** (talent + policy incentives + rents + peers, side-by-side) | **Selected as lead surface.** 8+ state policies in 8 different document formats, normalized nowhere publicly (**S05–S19**); fragmented counting denominators confuse every public number (**S02** vs **S08** vs **S04**); no neutral free comparison layer exists in the diagnostic scan (**S30**–**S38**). *Honest caveat [inference]:* no interview evidence yet that buyers prefer self-serve over consultant mandates — this is an explicit Phase-3 gate (open-questions Q3). | Supply-side documents + demand-side leasing (**S20–S24**) |
| **C. Provider discovery** (consultants/legal/real-estate/recruiters) | **Rejected as lead surface, retained as a secondary page.** Monetization exists (**S30** sells lead-gen to exactly this class) **but** discovered-provider trust is the asset — selling ranking power early destroys it (see business-model.md §4). Also weakest evidence: current provider set is seed-level. | Trust-coherence reasoning |
| **D. Jobs/watchlist monitoring** | **Deferred (Phase 4 candidate).** Highest demonstrated willingness-to-pay in the market (watchlists gate GCC Explorer's top tier, **S30**), but requires continuous ingestion we cannot credibly sustain with public sources in a prototype window. | Feasibility of data ops |

**Decision: B is the product. A is a supporting module. C is a lightweight page. D is parked with an explicit re-entry condition.**

---

## 2. Product decisions (required list)

### 2.1 Primary user persona — selected
**"Priya" — Location-strategy lead on an MNC expansion decision team** (India initiative), the desk analyst who assembles the city shortlist and the internal business case. One persona for v1 (see `personas.md` for full profile + two secondary personas we help but don't design for).

- Why this persona: they alone generate ~37–45% of recent national office absorption (**S20–S24**); they already pay for location intelligence through consultative channels (CBRE/JLL/Zinnov engagements, **S01**/**S24**); and the class of tool they'd self-serve with is priced in the market today (**S30**) — meaning budget exists without education. **[inference] on "self-serve preference," not on budget.**

### 2.2 Primary job to be done (JTBD)
> **When** my parent company mandates a new or expanded India capability centre, **I want** to shortlist defensible candidate cities — ranked by talent, cost, policy incentives, and peer presence for my specific function — **so that** I can build an evidence-backed internal case and start real-estate/policy conversations, before spending weeks of consultant time.

Success for this job = a shortlist their CFO/CBRE consultant/co-workers cannot easily poke holes in *and* that was produced in one working session, not three weeks.

### 2.3 Trigger
Any of these initiating events **[inference from announcements/news patterns, S08–S31 context]**:
1. Parent mandate lands: "evaluate India expansion (new centre / second centre / function relocation)."
2. Lease/footprint decision point on an existing centre (expansion vs relocation).
3. Peer move: a competitor or peer opens/expands an India GCC (competitor-anxiety entry).
4. Budget cycle: India initiative kickoff with a 3–9 month horizons and a known headcount target.

The trigger creates a *deadline-driven* question set: which cities, what cost, what incentives, who's already there.

### 2.4 Most painful current workaround (the status quo we replace)
Today's workflow for persona Priya:
1. **Collect fragments:** state G.O. PDFs in 8 formats, brokerage quarterly PDFs (CBRE/JLL), consultant decks (Zinnov/NLB/CIEL), press releases — each with different definitions, base years, and floors. Counting regimes differ so silently that two "2,000+ GCCs" numbers disagree by billions of dollars (**S02** vs **S04**).
2. **Assemble a spreadsheet** mapping functions ↔ talents ↔ incentives, amortizing eligibility thresholds (e.g., "₹20,000 per UP-domicile fresher", **S10**; "30/20/10% payroll subsidy years 1–3", **S06**; "₹50,000 one-month CTC cap", **S13**) by hand.
3. **Check validity** ("is this still in effect? status final or draft?"), then reconcile conflicts with no rule for who wins the discrepancy.
4. **Build the deck** and cross-check against brokers.

**Pain profile:** weeks of calendar time; error risk on every hand-merged number; no citation trail; no neutral normalization of terms like "Level-1 GCC" vs "Advanced GCC" (**S10**). *Confidence: document-anchored (8+ policy files + methodology conflicts); "weeks" is qualitative [inference].*

### 2.5 First high-value workflow (the core loop)
**"Function-first city shortlist → provenance-linked comparison → evidencing documents → saved/reusable."**

1. **Frame the search:** select function/sector (e.g., BFSI-ops, AI/ML, engineering design) + optional constraints (tier preference: hub vs tier-2; headcount range; subsidy archetype interest).
2. **Get ranked city cards** (talent signals, GCC presence, rent index, policy posture, peer denominators — each row carrying: value + unit + period + definition + source + verify date + confidence).
3. **Open the side-by-side compare view** (2–4 cities) with the state **policy incentive matrix** normalized into comparable rows (subsidy type, % bands, eligibility thresholds, effective dates, and *final/draft status* per state — Kerala stays `draft` per **S16**).
4. **Evidence every figure:** one click → the source record (publisher, URL, publication/verification dates, limitations, conflicts).
5. **Save & share:** persist the comparison (anonymous local persistence via `saved_research`), export/share to circulate in the org.

Exit criterion (definition of done for the user): a comparison they can defend at their next internal review — in under one working session.

### 2.6 Minimum viable product (v1 scope)
One coherent workflow, six surfaces:

| # | Surface | Scope (must) | Acceptance criteria |
|---|---|---|---|
| 1 | **Ledger-driven dashboard** | National headline grid with counting denominator caption ("2,117 GCCs — parent-firm direction; 3,728 delivery units — FCC-type definition"; per **S02**) + verified-era announcements feed | Every number on the dashboard fits one of: has source id + metric_period; or displays a "definition" chip; no mixed-denominator totals |
| 2 | **City explorer + compare** | Filterable/sortable city list (tier, talent metric, GCC units count, rent index, policy posture); "compare up to 4" side-by-side table; per-column provenance badges | Compare view renders uniformly; missing metric renders as "field not yet available" (never zero); each value links to source |
| 3 | **Policy tracker (embedded)** | Normalized state policy matrix: subsidy type / band / eligibility threshold / effective date / status (`final`\|`draft`) / source URL; sourced from finalized + draft policy PDFs (**S05, S06, S10, S13, S16**) | Two policies with identical claims from different states render as separate rows — never blended; draft/final marks visible |
| 4 | **Company directory (lean)** | Filterable GCC set by sector/city/status with provenance chips; used as peer evidence in compare view ("who's already in Pune?" — tasks like the **S21** Pune ~25% of Q3-25 GCC leasing = concrete peer surfacing) | No attempts to match 2,117 coverage (GCC Explorer territory — **S30**); coverage footnote states subset basis |
| 5 | **AI assistant (deterministic demo mode)** | Free-text Q&A routed to best-fit city/policy/company data; every answer returns its evidence bullets; refused (weak-evidence) queries get honest insufficiency responses | ≥1 cited record in every *answered* query; zero fabricated entities; overreachable queries return "insufficient evidence + suggested rephrase" |
| 6 | **Sources page + provenance regime** | Every source record (URL, publisher, pub date, verified date, scope, confidence, limitations, conflicts); seed-time lint fails build on sourceless values | 100% of displayed facts are one click from their source record |

Persistence for comparison sets via `saved_research` (anonymous) — included because it is the smallest scope that satisfies "comparison creation and reuse."

### 2.7 Explicitly excluded from v1
| Excluded feature | Why excluded (evidence-anchored) |
|---|---|
| User accounts / teams / workspaces / auth | No basis yet for multi-seat demand; anonymous persistence covers reuse for a prototype; revisit after Phase-3 interviews (tied to possible rename) |
| Payments / paywalls | Trust hypothesis stage; monetization must be validated before taxing usage (business-model.md §6) |
| Watchlists / alerts / jobs monitors | GCC Explorer already sells this at the top tier (**S30**/**S32**); requires sustained ingestion ops we can't commit to; **re-entry if** Phase-3 interviews show §2.2-failure (opportunity-prioritization.md §6) |
| Compensation data (city/function/salary bands) | Multi-source consistent premium (8–40%, **S25–S29**) is great evidence, but data licensing is the bottleneck (Phase-3 candidate) |
| Provider lead-generation or paid ranking | Conflicts with neutral-evidence positioning (business-model.md §4) |
| Slugging GCC Explorer's full depth (contacts/tech stack/exports) | Established vendor with daily updates and dedicated analyst team (**S31**); attempting parity this cycle is both infeasible and strategically backwards |
| Non-India markets | Out of scope; `gcc-atlas.com` covers global-hub comparisons (**S38**) |
| Renaming product | Kept for internal prototype; **flagged:** gcc-atlas.com exists (**S38**) — trademark check is a launch gate, not a Phase-2 blocker |

### 2.8 Competitive alternatives and why users would switch (and why they wouldn't)
See `positioning.md` §3 for the full matrix. Switch-style summary:
- **GCC Explorer ($3.5K–$10K):** broadest GCC company tracking; **switch because:** paid seats exceed a first-look budget; we answer *decisions-layer* (where/cost/policy), not *contacts/watchlists*; our free tier = provenance-first + denominators. **Won't switch if:** they need pipeline/lead-gen scale — that's the better GCC Explorer use case.
- **CBRE/JLL/Zinnov/consultancies:** authoritative, human-driven, expensive and time-heavy; **switch because:** we accelerate the pre-work, arriving at the mandate/broker conversation with a shared evidence base. **Won't switch unless:** mandate type requires bespoke modeling.
- **IPA portals/government PDFs (free):** fragmented and inconsistent; **switching:** normalization + usable UX + citation trails.
- **GCC Village:** instructive on what not to be (**S35**): inconsistent coding undermines trust; we win on discipline.
- **gcc-atlas.com:** currently global-hub comparison; not our space; names may collide **S38** — rename/trademark pending.

### 2.9 Initial go-to-market approach
Ecosystem-catalyst **two-channel** plan (prototype-stage, trusted-content-driven, zero direct cold-calls to enterprise parties):
1. **Content catalysts (channel A — IPAs/policy watchers, event-keynote material):** publish the *state policy matrix + city comparison* free and linkable; seed LinkedIn/forum activity with shareable comparison links (e.g., "UP's fresher incentive at ₹20,000 vs TN's 30/20/10 payroll subsidy" — **S10** vs **S06**; "GIFT City 10-year tax holiday context," **S15**). These links *demonstrate value* without demo calls.
2. **Ecosystem-learned self-serve (channel B):** aim the assistant + compare workflow at ETGCC/NASSCOM GCC-summit style event audience (**S12**, **S18**, **S27** show active event cadence) — thought-leadership content marketing *with* citations to our own product surfaces as share-of-voice; a waitlist + feedback interview offer at the bottom of every page.
3. **Metrics-guided iteration:** publish nothing claiming production-grade coverage; copy is pre-alpha-labeled; the waitlist and usage instrument (success-metrics.md) are the real signal and the **only** Phase-2 KPI set.
*Anti-pattern guarded against:* inventor surveys or fabricated pipeline — forbidden by Phase 1 ground rules.

### 2.10 Pricing hypotheses and test plan
Hypothesis first, invoices later. Confirmed anchor: the market prices comparable seat-and-data products at **$3,500–$10,000** per year or half-year (**S30**) and previous static lists at **$9,999–$12,000** (**S33** archive). But **[inference]** our product's willingness-to-pay is not validated.

Hypotheses (to test, not to ship as fact):
- **H-P1 (free tier):** value should be created free on "city policy + comparison" layer first. *Test = funnel:* repeated comparisons created per unique user ≥ probe worthy; targeted retention D7 behavioral signal.
- **H-P2 (self-serve Pro, individual):** ₹ cr suggested price point **$99–199/yr** (about 30–60% of cheapest competitor's $3,500 6-month tier on-seat rate). *Test = fake-door + waitlist conversion:* hosted pricing page (pre-alpha banner) capturing "interested at this price / see me features" split; > 10% click-through of waitlist respondents into fake door = signal above noise.
- **H-P3 (team seats + workspace):** **$500–$2,000/team/yr** spectrum. *Test = discovery interviews + a not-too-cheap Van Westendorp light (4-price question battery) in round 1 of real interviews (Phase 3).*
- **H-P4 (premium intelligence reports):** Free "state-of-GCCs" quarterly not possible until we can commit (**S31/S32** analog). *Test = first report shipped as free download in Phase 3; gauge to paid upgrade under H-P2.*
- **H-P5 (provider subscriptions — verified profile/enhancement, never ranking):** ₹ sheet conflict guarded (business-model.md §4). *Test = corridor via provider listings-page opt-in; measure provider take-rate not on the market, on candidate pipeline response.*
- **H-P6 (qualified introductions):** only non-paid features on the platform's product surfaces (see below); suspicion deferred pending trust analysis (business-model.md §4).

Instrument: no paywall implementations until a hypothesis clears (retention + fake-door + interview triangulation simultaneously; simplest threshold in success-metrics.md).

---

## 3. Architecture-fit requirements (what the build must do above pure feature list)

The repository already implements the backend (SQLite, normalized schema with explicit `source_id` FKs, provenance/estimate/confidence per metric, saved_research JSON bag) and frontend (Explorer/Cities/Providers/Assistant/Sources/Saved pages). Phase-2 build requirement list:

1. **Seed-data alignment** (open Phase-1 gap: seed policy values don't yet match the newly-verified figures):
   - Tamil Nadu: 30%/20%/10% payroll subsidy years 1–3; >₹1 lakh/month salary threshold; Forbes Global 2000/Fortune 1000 / 200+ jobs eligibility (**S06**).
   - Karnataka: 500 new GCCs / 1,000 total by 2029 / 3.5 lakh jobs / $50B output (**S05**).
   - UP: finalized May 2025 status + incentive bundle per **S10**/**S11** (incl. ₹20,000/fresher recruitment subsidy).
   - Gujarat: 250 units / 50K jobs / ₹10,000 cr + employment-assist caps per **S13**/**S14**.
   - Kerala: status = `draft` until finalized; both target variants retained with source tags (**S16**–**S18**).
2. **Schema extension (small, backward-compatible):**
   - `policies.status` (`draft` / `finalized_data` / `announced`), `policies.normalized_benefits` JSON for compare rendering.
   - `city_metrics` rows all carry source; add the "counting basis" strings.
3. **Seed-time linter (CI):** a source row inserted without `source_id` on policies and on `city_metrics` fails the build (raised in open-questions.md §3 as risk).
4. **Assistant citation rule:** response requires ≥1 evidence record when evidence strength passes the existing threshold; below threshold → explicit "insufficient evidence" message instead of an answer.
5. **Metrics instrumentation hooks:** `search`, `detail_view`, `compare_create`, `compare_reopen`, `source_click`, `export` events (client-side beacon to `/api/events` with no-user identifying data; server aggregates). Event catalog in success-metrics.md.
6. **Indicators of trust in UI:** provenance chip component + "conflicting figures" renderer that shows *both* values with attribution (**S02**/vs/`S04`-style) where the Sources page carries the full register.
7. **Deployment:** public Vite build + Node backend on a PaaS; DB deployed as a deployed persistent volume; deployment marker: a public URL that the assignment deliverable links to.

## 4. Acceptance-adjacent definition (when is v1 done)
- `(a)` all seed data passes the linter, `(b)` compare flow completes end-to-end with provenance visible, `(c)` assistant demo answers cite records or decline, `(d)` event ingest live with the Phase-2 KPI pack visible to admin, `(e)` deployed URL runs the seeded data (no console errors, no 404 API paths).
- Confidence: the five previous criteria are all verifiable in < 5 minutes of exploration.

---

## 5. Dependencies, risks, confidence (summary; full version in feature-prioritization.md)
- **D1** — seed alignment must precede Polish + instrument (data first, then UX).
- **D2** — assistant citation rule depends on deterministic-mode logic (already built; extend not rebuild).
- **D3** — deployment gate: credentials still needed from the user (delivery risk).
- **R1** — per open-questions.md §3: name collision, competitor free-layer release, policy draft revisions, sourceless-value corruption.
- **C1** — confidence legend throughout this PRD: **[evidence]** = anchored in source-register ID; **[inference]** = reasoned but unvalidated; **[proposal]** = target/hypothesis, not a measured fact.

---

## 6. Non-goals recap
Stay narrow, be precise: we are building the **decision layer** for one persona in one country — not a database moat against GCC Explorer (**S30**), not an HR/compensation toolkit (**S25–S29** retained as Phase-3 specs), not a lead-gen marketplace (trust policy in business-model.md §4), and never fictional users or invented data points.

---

*Prepared 2026-10-19 for the Flexiple Product Intern assignment. Full evidence trail lives in `research/source-register.csv`; companion Phase-2 artifacts: `personas.md`, `user-journeys.md`, `feature-prioritization.md`, `business-model.md`, `positioning.md`, `success-metrics.md`, `roadmap.md`, and the one-page `product-brief.md`.*
