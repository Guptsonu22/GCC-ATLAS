# GCC Atlas — Roadmap

*Three phases with explicit gates. Phase 2 (now) = prototype; Phase 3 = validation; Phase 4 = paid/monitoring options only if gates clear. Sequencing mirrors `feature-prioritization.md` build order (F1→…→F11). Dependency-driven; no date promises beyond the assignment window since deployment-credential timing is user-gated.*

---

## Phase 2 — Working prototype (current phase)

**Goal:** the strongest coherent workflow (function-first city shortlist → provenance-linked compare → evidence audit → saved/share) built, linted, instrumented, deployed.

| # | Work item | Ref | Effort | Output / acceptance |
|---|---|---|---|---|
| 2.1 | Align seed data to Phase-1-verified figures (TN / UP / Gujarat / Kerala statuses / Karnataka) + demo-vs-real labeling | F1 | S | Seed passes linter; register IDs crosswalk `research/source-register.csv` to `sources` table |
| 2.2 | Provenance chip component + counting-denominator captions on headline/count tiles | F2, F3 | M | Every displayed number → chip → source record |
| 2.3 | City compare (2–4) + policy matrix renderer with `draft/final` + "not yet tracked" semantics + `policy_row_expand` | F3, F4 | M | Kerala dual-target case renders both values w/ years (**S16 vs S18**) |
| 2.4 | Sources page hardening (scope/confidence/limitations/conflicts fields from register) | F5 | S | 1-click provenance from any number |
| 2.5 | Seed-time lint (sourceless value → build fail) | F6 | S | CI green + lint report artifact |
| 2.6 | Assistant citation hard rule (≥1 record per answer; insufficient-evidence path preserved) | F7 | S | Extended test suite; refusal path intact |
| 2.7 | Saved comparison + share link (anonymous) | F8 | M | Reopen restores state; share URL functioned |
| 2.8 | Company directory provenance chips + coverage footnote (anti "we have 2,117" claim) | F9 | S | Footnote states subset basis (**S30** context) |
| 2.9 | Event instrumentation (catalog) + admin aggregate | F10 | M | M1–M6 + guardrails computable |
| 2.10 | Deployment (FE + BE + DB) to public URL | F11 | M | Deployed link deliverable; two-PaaS runbooks prepared in advance |
| 2.11 | Fake-door pricing screen (labeled planned, T2 only) | F20 | S | Interest measurement live without real checkout |

**Phase-2 exit gates:** (a) all 6 required surfaces usable end-to-end; (b) linter green; (c) assistant cite-or-decline passes; (d) instrumentation live; (e) deployment takes the assignment URL; (f) artifacts here + research remain mutually consistent (no figure in product copy that research doesn't source).

**Phase-2 known risks:** deployment credentials (user-gated); stale-figures risk at review time → re-verification pass scheduled at submission (open-questions §5.4); name-collision caution in any public share (**S38**).

## Phase 3 — Validation loop (post-prototype)

**Gate to enter:** Phase-2 exit criteria met + ≥ 1 public deployment live.

| # | Work item | Success signal |
|---|---|---|
| 3.1 | Recruit 5–8 real discovery calls (Q3 of open-questions.md) — personas Priya/Rakesh classes only; **no fabricated interviews** | Field evidence replaces **[inference]** assumptions; confirms or invalidates the core bet |
| 3.2 | Resolve Q1/Q5 (GCC Explorer methodology + their free quarterly) → sharpen our methodology page | Cleaner "denominator" copy; positioning sharpen |
| 3.3 | First free quarterly "State of GCC comparison methods" report (content-catalyst GTM) | Distribution evidence; not monetized |
| 3.4 | T3 Van-Westendorp-lite interviews + T4 $1-deposit waitlist probe | H2a price band sanity |
| 3.5 | Metric recalibration (M1/M3/M4 with real n) + finish tier-2 posture rows (Kerala finalization tracking, **S16→S18**) | Targets re-baselined from instrumented data |
| 3.6 | Trademark/availability check on working title **[gate to anything public-facing]** | Rename or keep (decision memo) |

**Phase-3 exit gate:** decision made — (i) scale free tier� + prep paid Pro (H2 → build pricing), or (ii) pivot to watchlist/alerts (O4 re-entry per opportunity-prioritization.md §6), or (iii) hold and harden data ops.

## Phase 4 — Expansion (conditional)

**Gate to enter:** Phase-3 exit decision (i) or (ii).

| Option | Pre-commitment constraints |
|---|---|
| Self-serve Pro (subscriptions) per H2a | T1 behavior gate passed; fake-door T2 ≥ threshold; VC-truth conflict review done |
| Team workspaces | Only if H2 cleared + real multi-seat ask from ≥ 3 teams **[proposal threshold]** |
| Premium intelligence reports (H4) | After first free report; pricing $299–$499 one-off **[proposal]** |
| Provider Verified profiles (H5) | Only under business-model §5 pre-committed neutrality design |
| Watchlist / alerts / monitoring (F17, Phase-3 pivot path) | Ingestion ops plan (public-source crawlers + change-detection) resourced; sprints decided |
| Compensation bands (F18→O5 re-entry) | Only with a data-license plan (TeamLease/comp vendors) — cost verified first |
| Qualified introductions (H6) | Default OFF; revisit under §4 (iv) rules only |

**Phase-4 hard non-negotiables (unchanged across pivots):** provenance contract intact in every new surface; provider-paid ranking still banned; numbers carry denominators; conflicts render in pairs.

---

## Dependency map (compressed)

```
Research registry ──(2.1)──► Seed align ──(F6 lint)──► Provenance UI (2.2/2.4)──► Compare+Policy (2.3)
                                                    └──► Assistant cites (2.6)
Instrumentation (2.9) needs Compare+Assistant live
Deployment (2.10) needs lint green (2.5); credential gate
Phase-3 interviews need deployment (2.10)
Pricing doors need T1 (behavior gate: M3/M4)
```

## Risk register (top 5, live)
1. **Deployment credential dependency** (Phase 2, user-side) → runbooks + retry cadence; worst case: static FE + hosted read-only API fallback demo.
2. **GCC-Explorer free-layer counter-move** (S30/S31) → differentiator is not "free" alone; provenance/methodology depth is the moat to keep polishing.
3. **Policy drafts churning (Kerala `draft`, S16)** → status field + re-verification cadence.
4. **Name collision (S38)** → working-title labels now; formal check at 3.6.
5. **Small-n metric noise (M3/M4 early)** → G4 rule: no trends reported under n < 30/week [proposal].

---

*Prepared 2026-10-19. Sequencing and gating align with `feature-prioritization.md` scores; Phase-3 completion depends on real-user access, which the assignment setting does not assume.*
