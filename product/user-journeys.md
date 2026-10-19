# GCC Atlas — User Journeys

*Journeys for the three personas in `personas.md`, mapped to the actual build (Explorer / Cities / Providers / Assistant / Sources / Saved surfaces). Each step lists: user intent → system behavior (what the build does) → evidence displayed → instrumented event (see `success-metrics.md`) → exit criteria. Journeys include failure paths, per Phase-1 discipline on missing data ("field not yet available" never renders as zero — Kerala target variants show both values, **S16–S18**).*

---

## Journey 1 (PRIMARY) — Priya: mandate to defensible shortlist

**Entry trigger:** parent mandate to evaluate India expansion for a 400-seat analytics/function hub; 6 months to internal review. **[Proposed timing; trigger classes evidence-anchored in PRD §2.3]**

| # | Step | User intent | System behavior (the build) | Evidence displayed | Instrumented event |
|---|---|---|---|---|---|
| 1 | **Frame** | Clarify criteria: function (BFSI-ops / AI-ML), tier preference (open to tier-2), headcount 400 | City Explorer opens; function/sector filter chips; tier filter; "reading" of the mandate via assistant prompt if she chooses | Filter definitions have tooltips ("GCC units = delivery locations >30 headcount per Nasscom–Zinnov practice, **S01/S02**") | `search` |
| 2 | **Ranked scan** | Quickly triage 8–12 candidate cities | City cards ranked for selected sector; per-card: talent signal, GCC-unit count, rent index, policy posture chip; each metric carries source + verify date | Any missing metric shows "not yet tracked" — never 0 | `detail_view` |
| 3 | **Side-by-side compare** | Deep-compare 3 finalist cities (e.g., Pune vs Hyderabad vs Kochi) | Compare view: columns = cities, rows = metric groups (Talent / Cost / GCC presence / Policy incentive); up to 4 columns | Provenance chip per cell; clicking opens the source record (**S20**–**S24** for leasing; **S06/S10/S13/S16** for policies) | `compare_create` |
| 4 | **Normalize policies** — the differentiating step | "What do UP/Gujarat/TN actually pay in my case?" | Policy matrix rows: subsidy type (payroll %, capex %, per-fresher, EPF, stamp/land), band or amount, eligibility threshold, effective date, **status** (`final`\|`draft`), state + source URL | Kerala row visibly `draft` with both target variants shown (**S16** vs **S18**); UP reflects finalized May-2025 numbers incl. ₹20,000/fresher (**S10**/**S11**); TN shows 30/20/10 band with >₹1L salary floor (**S06**) | `policy_row_expand` |
| 5 | **Evidence audit (defend)** | Survive the CFO/consultant challenge | One-click from any figure → Sources page record: publisher, publication date, verified-on date, scope, confidence level, known limitations, conflicting estimates (where applicable) | Conflicting pair example: FY2026 revenue $98.4 B (Nasscom–Zinnov, **S02**) vs $164 B (Wizmatic, **S04**) render side-note "definition differs — see register" — never silently averaged | `source_click` |
| 6 | **Peer evidence** | "Who is already in Pune?" | Company directory filtered to city/sector; peer counts against **S21**'s city-level leasing reality (Bengaluru/Pune/NCR = 67% of Q3-25 GCC leasing) | Company rows carry source chips; coverage footnote states the subset basis (we do NOT claim all 2,117 — **S30** overlap risk documented) | `detail_view` (company) |
| 7 | **Save & circulate** | Keep, share, iterate with the team | Save named comparison (anonymous persistence, `saved_research`); shareable view URL; lightweight notes field | Saved set list on Saved page; reopening restores state | `comparison_save` → `compare_reopen` |
| 8 | **Ask the assistant** | Slack-style sanity check: "Which states subsidize BFSI jobs above ₹1L/month?" | Deterministic demo-mode retrieval over local dataset; returns the matched policy rows + companies with evidence bullets; refuses to fabricate beyond evidence | Weak matches (sector-keyword-only) return insufficient-evidence language (existing behavior, verified in build) | `assistant_query`, `assistant_answer` |

**Overall exit criterion:** comparison saved and circulated with per-figure provenance in **one working session**. If any single step blocks >2 minutes, the journey is failed (design bar, not a measured baseline — **[proposal]**).

**Failure paths:**
- *No metric for a city in a group* → row view "not yet tracked" + which register/source would supply it; no interpolation.
- *Assistant overreach* → insufficient-evidence reply + suggested rephrase (existing insufficient-evidence logic).
- *Draft policy spotted mid-flow* → non-blocking banner on rows (`draft`/`final`) so Kerala never enters a deck as actionable — protects Priya's review credibility.

---

## Journey 2 — Priya (secondary path): assistant-led quick answer

Might not start at a saved comparison; starts with a question. "What will 400 seats cost me in Pune vs Bengaluru incl. payroll-type incentives?"
- Assistant returns: matched city metrics (rent index where available) + policy rows (TN's payroll floor **S06**/UP's fresher subsidy **S10** as adjacent-but-not-identical patterns) + 1-click jump into matching compare set.
- **Guardrail:** every cost-class figure must be flagged `estimate`/`quoted-based` (CBRE's caveat behavior, **S20**–**S23**) so the answer doesn't imply transaction-level pricing.
- Events: `assistant_query`; if she follows with compare_create — journey carries into Journey 1 at step 3.

## Journey 3 — Rakesh (IPA): share his state's story, fairly
| # | Step | Behavior | Evidence | Event |
|---|---|---|---|---|
| 1 | Opens the *state policy matrix* | His state's policies; neighboring states' rows visible for context | Status per row; pension of draft Kerala marked | `policy_row_expand` |
| 2 | Picks 3 comparable states | Compare view re-imagined for policy columns; neutral third-party tone (both-conflicting-numbers-visible if disputes exist) | Policy URLs from G.O.s | `compare_create` |
| 3 | Copies the shareable link | Anonymous-shared view; no login desired — friction is fatal here | — | `comparison_save` |
- v1 constraint: no lead capture from his usage; no upselling to his office; copy reads as neutral "reference", pre-alpha banner.

## Journey 4 — Maya (provider BD): verify before a meeting
- Opens city compare set created by an industry colleague; runs assistant ask ("which tier-2 states added GCCs in the last 2 quarters?"); upgrades nothing.
- **v1 restraint acknowledged:** this journey gives Maya *credibility aids*, not leads; her monetization touchpoint is deferred (business-model.md §4–§5).
- Event: `assistant_query`, `detail_view` (company).

---

## Instrumentation event catalog (v1)
`search`, `detail_view` (city/company/policy/provider), `compare_create`, `compare_reopen`, `comparison_save`, `policy_row_expand`, `source_click`, `assistant_query`, `assistant_answer` (with `evidence_strength` in {strong, weak, refused}), `export` — all anonymous, batched client-side, no PII, aggregated server-side.

*Derived from PRD §3.5; the required six success metrics (`success-metrics.md`) read only these events.*
