# GCC Atlas — Feature Prioritization

*Transparent impact-vs-effort scoring. All Phase-2 items are scoped to what the working build can absorb without re-architecture. Impact is judged against the primary persona's job (PRD §2.2) and the trust thesis (positioning.md). Not all vision items are implemented — that is the point of this file. Every anchor is a `research/source-register.csv` ID; any judgment without evidence is tagged **[inference]** or **[proposal]**.*

---

## 1. Scoring model

- **Impact (1–5):** how much it moves the chosen workflow + trust thesis + a required success metric.
  - Weighted: persona-value 40%, differentiation 25%, deployability for the assignment deliverable 20%, monetization optionality 15%.
- **Effort:** S = ≤ half-day; M = ≤ 2 days; L = > 2 days (calendar estimate for the existing stack [proposal]).
- **Priority score** = Impact / Effort(frac) as a ranking aid, then crosschecked by MoSCoW.
- **Confidence:** High = multiple research anchors or invariant-enforcing; Medium = single anchor or inference; Low = speculative.

---

## 2. Scored backlog (v1 ± nearest neighbors)

| # | Item | Impact | Effort | Score | Priority | Confidence | Dependencies / Risks | Evidence anchors |
|---|---|---|---|---|---|---|---|---|
| F1 | **Seed-data alignment to verified figures** (TN 30/20/10 >₹1L; UP finalized + ₹20k/fresher; Gujarat 250/50K/₹10K cr; Kerala draft-vs-outlook 120/150 with years; Karnataka 500/1,000/3.5L/$50B) | 5 | S | 5.0 | **MUST** | High | Blocks F3/F4 comparison integrity; risk = stale pre-research values shipping | **S05, S06, S10, S11, S13, S14, S16, S17, S18** |
| F2 | **Counting-denominator institution** (headline captions + definition chips everywhere a count appears) | 5 | S | 5.0 | **MUST** | High | Depends on F1; risk = caption fatigue if over-applied → apply on headline + count tiles only | **S01, S02 vs S04, S08** |
| F3 | **City compare view (2–4) with provenance per cell + "not-yet-tracked" semantics** | 5 | M | 4.2 | **MUST** | High | Needs F1; risk = table overload → cap at 4 columns; group rows | **S20–S24, S05–S19** |
| F4 | **Policy matrix renderer** (normalized rows; status draft/final; both-conflicting values shown where present) | 5 | M | 4.2 | **MUST** | High | Kerala dual-value case is the acceptance test | **S16 vs S18; S02 vs S04; S06, S10, S13** |
| F5 | **Source page hardening** (record layout w/ publisher, dates, scope, confidence, limitations, conflicts) | 4 | S | 4.0 | **MUST** | High | Provenance one-click rule; register already exists in seed | **register rows S01–S40** |
| F6 | **Seed-time lint: fail build on sourceless policy/metric values** | 5 | S | 5.0 | **MUST** | High | Prevents the fictional-data risk identified in open-questions §3 | provenance policy (PRD §3.3) |
| F7 | **Assistant citation hard rule in demo mode** (≥1 evidence record per answer; insufficient-evidence path preserved) | 5 | S | 5.0 | **MUST** | High | Existing logic extends; test coverage exists (37 passing tests baseline) | assistant.ts already enforces weak/strong evidence |
| F8 | **Saved comparison persistence + share link (anonymous)** | 4 | M | 3.4 | **MUST** | High | `saved_research` exists; share-link is state-in-URL | reuse metric prereq (success-metrics M4) |
| F9 | **Company directory (lean, sourced)** w/ sector/city filter + coverage footnote | 4 | S | 4.0 | **MUST** | High | Pre-built; add provenance chips + coverage footnote; no GCC-Explorer chase | **S30** (avoid parity), seed company set |
| F10 | **Event instrumentation** (`search→detail_view→compare_create→source_click→assistant_*` + heartbeat) anonymous, batched | 4 | M | 3.6 | **SHOULD** | High | Needed to measure all required Phase-2 metrics; cookieless | success-metrics.md catalog |
| F11 | **Deployment to public URL** (FE + BE + DB volume) | 5 | M | 4.2 | **MUST (assignment)** | Medium | Credentials from user; risk = platform flakiness; fallbacks chosen per platform | PRD §3.7 |
| F12 | **"Both conflicting figures" visual pattern** (S02-vs-S04 style side-note renderer) | 3 | S | 3.0 | SHOULD | High | Displays honesty, differentiating vs GCC Village-type directories | **S02 vs S04; S35** |
| F13 | **Provider page as v0.5** (sourced listings only; zero monetization/ranking) | 2 | S | 2.0 | SHOULD | High | Already built; keep minimal to avoid trust risk | business-model §4; seed providers |
| F14 | **Onboarding explainer ("how we count / why provenance")** 1-page static | 3 | S | 3.0 | SHOULD | High | Cheap trust multiplier for first-impression users | **S02/S08 conflict example** |
| F15 | **Pre-alpha banner + re-verification date on homepage** | 3 | S | 3.0 | SHOULD | Medium | Sets expectation; reduces misquote risk of our numbers by press | open-questions §3 |
| F16 | **Excel/CSV export of compare** | 3 | M | 2.5 | COULD | Medium | Nice-to-have for persona workflows; deferred to Phase 3 unless < 1 day | persona JTBD #3 **[inference]** |
| F17 | **Watchlist / jobs monitor** | 4 | L | 2.0 | **WON'T (v1)** | High (that it must wait) | Continuous ingestion ops = infeasible for prototype; strongest competitor tier already sells this | **S30/S32** |
| F18 | **Compensation city/function bands** | 4 | L | 2.0 | **WON'T (v1)** | Medium | Licensing risk; multi-source premium validated but access cost uncertain | **S25–S29** |
| F19 | **User accounts / team workspaces** | 3 | L | 1.7 | **WON'T (v1)** | Medium | No demand evidence yet; anonymity flow safer for trust build | **[inference]** |
| F20 | **Payments / pricing page (real)** | 3 | M | 2.5 | **WON'T (v1 — fake-door only)** | Medium | H-P2 test runs as a labeled hypothesis screen only | business-model §6 |
| F21 | **Provider monetization (paid ranking/leads)** | 4 | M | 2.0 | **WON'T** | High — trust thesis kills it | business-model §4 policy | — |

### What "strongest coherent workflow" means here
F1→F2→F3→F4→F5→F6→F7→F9 form **one workflow** (the compare shortlist) executed across the existing pages; F8/F10 make it measurable; F11 makes it demonstrable. F17–F21 are explicitly *not* built now — every one of them is either already owned by a competitor (S30/S32), blocked by data-licensing reality (S25–S29), or a trust hazard (F21).

---

## 3. Dependency graph (build order)

```
F1 (data) ──► F3 ──► F4 ──► F12
   │            │       └──► F5 ◄── F13 (reuses Source records)
   │            └──► F8 ◄── F6 (lint gates both)
F2 (captions) ──► everywhere ── gate by F6
F7 (assistant cites) ◄── F1 (policy rows cited)
F9 (directory chips) ◄── F5
F10 (events) ──► success-metrics toggles
F11 (deploy) ── ► everything (last, but parallel-ready after F6)
```

## 4. Risks (with mitigations)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Verified figures go stale between Phase 2 and evaluation | High | Medium | Every row carries verified-date; re-verification is a 30-minute pass at submission time (per open-questions §5.4) |
| Compare view too dense to parse | Medium | Medium | Cap 4 cities; group metric rows; progressive disclosure via row expansion |
| Name collision (gcc-atlas.com, **S38**) surfaces during assignment sharing | Medium | High (brand) | Keep "pre-alpha, working title" labeling; rename decision gate before public GTM |
| Seed linter over-blocks (too strict validators on manually-maintained sources) | Low | Medium | Whitelist `is_demo_data` flag semantics — demo dataset is allowed, but must be *labeled demo* at value-level, never mixed with real sourced rows |
| Event ingest (F10) distorts on tiny traffic (small-n) | High | Low | Metrics defined with minimum-n thresholds; report only aggregates (success-metrics §4) |
| Deployment credential unavailability | Medium | High (deliverable) | Prepare two PaaS runbooks now; ask user to choose platform (fail-fast dependency) |

## 5. Confidence summary
- High-confidence items: F1–F9 (all anchored: 8 policy documents, 5 market reports/dedicated pages, register already in repo).
- Medium: F11 (operational, not conceptual; needs user credentials), F12/F15 (design choices with strong logic but no user evidence).
- Explicitly-Low confidence (deferred instead of built): F17, F18, F19; and the *levels* of pricing in business-model.md — all posted as hypotheses there.

*Prepared 2026-10-19. This file intentionally does not include impact traits we cannot later verify (no invented user counts, no invented conversion targets — those are proposals only in `success-metrics.md`).*
