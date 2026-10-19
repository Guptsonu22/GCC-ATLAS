# GCC Atlas — Success Metrics

*Ground rule: **no baselines are fabricated.** Nothing has been measured yet (prototype stage, no launched funnel). Each metric below defines (a) what it is, (b) how it is instrumented, (c) a **proposed target** clearly tagged **[proposal]** with the assumption behind it, and (d) when that target would be revisited. Event catalog lives in `user-journeys.md`; instrumentation item F10 in `feature-prioritization.md`.*

---

## Required six (assignment spec) + guardrails

### M1 — Time required to answer a market-entry question
- **Definition:** first-touch to a *usable output*; operationalized as `first meaningful event → compare_create(+saved)` elapsed time, plus a manual usability test script (svg timed task: "create a 3-city comparison for AI/ML talent with policy rows visible").
- **Instrument:** client event timestamps; small sample scripted sessions (n ≥ 5 testers at Phase 3).
- **Proposed target [proposal]:** median < 10 minutes for the scripted comparison task; < 30 min including evidence audit. *Assumption:* current workaround is calendar-weeks (document-anchored 8 policy formats + fragmented definitions, **S05–S19**, S02-vs-S04), so even a 10–30× reduction is a strong claim — the assumption is directional, not measured.
- **Revisit when:** first 20 real users (Phase 3).

### M2 — Percentage of factual answers with supporting evidence
- **Definition:** the invariant we can actually guarantee. Two layers: (i) static-UI layer — % of displayed numeric values with a live source link (max = 100%, enforced by F6 seed linter); (ii) assistant layer — % of *answered* assistant queries containing ≥1 evidence record (refusals excluded from numerator and counted separately).
- **Instrument:** seed-lint report; assistant `evidence_strength` field; sources-page hit capture via `source_click`.
- **Target:** 100% static-layer (hard invariant — not a stretch goal, a release gate). Assistant layer ≥ 95% of answered queries with ≥1 citation, and refusals reported rather than suppressed *[proposal, based on the existing strong/weak evidence logic already shipped in the build]*.
- **Revisit:** every release.

### M3 — Search-to-detail-view conversion
- **Definition:** % of `search` events followed by ≥1 `detail_view` within the same session.
- **Instrument:** session-scoped event funnel.
- **Proposed target [proposal]:** ≥ 40% at Phase 3. *Assumption:* tools withWorking empty-result dead-ends typically see underperforming conversion; this figure is chosen as a floor for "search works" — **it is not a measured fact**, and it will be recalibrated against instrument tooling comparisons once real data exists.
- **Revisit:** first real funnel report.

### M4 — Comparison creation and reuse
- **Definition:** (i) creation — % of unique sessions creating ≥1 comparison; (ii) reuse — % of created comparisons reopened within 7 days (`compare_reopen`).
- **Instrument:** `compare_create`, `comparison_save`, `compare_reopen` + anonymous session id.
- **Proposed targets [proposal]:** creation ≥ 25% of sessions (primary persona-specific loop); reuse ≥ 20% of saved comparisons in 7 days. *Assumption:* reuse is the leading indicator of a tool-job (" Shortcut artifact" per persona JTBD #3); target set to be refine-able once baselines exist.
- **Revisit:** Phase 3 (weekly cohort).

### M5 — Data freshness and completeness
- **Definition (freshness):** % of source records re-verified within the last 180 days; % of policy rows whose `status` was checked within the last 60 days (draft-state recency: Kerala's draft, **S16**, exists to catch exactly this).
- **Definition (completeness):** coverage of the planned core metric set (talent signal, GCC-unit count, rent index, policy posture) per configured city; reported as numerator/denominator with the "not yet tracked" exposure actually visible (e.g., Tier-2 talent coverage across 12-city seed).
- **Instrument:** register timestamps, seed report, admin coverage page.
- **Proposed targets [proposal]:** freshness ≥ 95% re-verified ≤ 180 days at每 Phase gate; completeness ≥ 80% core metrics per city **for the 6 hub cities** (Phase-2 scope; tier-2 cities ride along at whatever the register supports — never padded). *Assumption:* given 5-month-old FY2026 anchoring (latest reportuations from May 2026, **S02/S03**), a 180-day cycle is achievable for a manual research cadence; complete tier-2 depth is not promised per open-questions Q6.
- **Revisit:** every Phase gate + at submission time.

### M6 — User retention and potential paid conversion
- **Definition:** (i) D7 / D30 return of anonymous visitors (session-id cohorting); (ii) "potential paid conversion" via the *labeled fake-door* funnel (T2 in business-model §6): % of waitlist opt-ins selecting a price-tier interest and % completing staged signup. Both are hypothesis probes, not invoices.
- **Instrument:** daily/weekly admin aggregate; waitlist provider (no PII beyond email for waitlist).
- **Proposed targets [proposal, deliberately conservative]:** D7 ≥ 15% for scheduled users; waitlist→fake-door interest ≥ 10% [these are pre-launch guesses benchmarked only to "self-serve tool" conventions; explicit **[inference]**]. No paid conversion number is claimed until T1–T4 run.
- **Revisit:** 4 weeks post-launch, then monthly.

### Guardrails (trust-health metrics — read always)
- **G1 Refusal quality:** assistant `refused` events logged with sample audits (goal: refusals are *right* more often than not; audited monthly).
- **G2 Conflict rendering:** # of conflicts surfaced vs. total known conflicts (must be 100% when applicable — register carries the completeness side).
- **G3 Provenance accessibility:** % of numeric tiles one click from source (target 100%; lint-gated).
- **G4 Instrument honesty:** never present small-n (n < 30 weekly events) aggregates as trends — report as "insufficient data" [proposal; avoids self-deception].

---

## Reporting cadence & integrity rules
- All event ingestion is *anonymous session-id* only (no PII) — instrumentation passes the trust contract itself.
- Numbers in any shipped dashboard labeled: (i) `proposal` (target), (ii) `measured` (with date + n), or (iii) `insufficient-n`.
- Dead rule avoided deliberately: a baseline *does finally exist* when M1/M3/M4/M6 have ≥ 30 events or ≥ 4 weeks of live data.

---

*Companion artifacts: `user-journeys.md` (event catalog), `feature-prioritization.md` (F10 instrument), `business-model.md` §6 (pricing tests). Prepared 2026-10-19.*
