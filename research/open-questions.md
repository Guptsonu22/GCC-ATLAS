# GCC Atlas — Phase 1 Open Questions & Validation Plan

Assumptions that still need real-world validation before (or during) the next phase. No interviews have been claimed; this file records **exactly what evidence is still not in hand**. Source IDs refer to `source-register.csv`.

---

## 1. Burning unknowns

| # | Question | Why it matters | How to resolve cheaply | Current status |
|---|---|---|---|---|
| Q1 | **Which counting regime does GCC Explorer use** (parents vs delivery units; any headcount floor)? | Our "denominator transparency" advantage depends on being able to *state* the difference | Read GCC Explorer's methodology/FAQ/about page directly; email their info alias if not public | **Not resolved** — pricing page shows coverage but not methodology (S30/S31) |
| Q2 | Will domain-related legal/availability risk on "GCC Atlas" name block launch? | Product name (S38 collision) | Trademark search (India class 9/42 + global) — a 20-min task once user contacts are reachable | **Not resolved** — no search done |
| Q3 | Does a target segment-A user actually prefer self-serve comparison over a CBRE/JLL/Zinnov engagement? | Our "cheap, self-serve" wedge depends on it | 4–6 real discovery calls (couldn't be conducted in Phase 1 due to no network access yet; **do not fabricate**) | **Not resolved** — logged as Phase-2 gate |
| Q4 | What is the genuine renewal/monitoring demand for GCC data vs one-shot mapping? | Determines whether GCC Atlas should sell "reports" or "monitoring" | Ask in the same Q3 interviews; crib from GCC Explorer's tier design (S30: continuous updates only in the 360 tier) | Partial — GCC Explorer architecture suggests high ticker-like value on updates (they gate update-cadence at the top self-plan)
| Q5 | What exactly does the Free quarterly "State of GCCs" report (S31/S32) contain — how much competitive overlap in one report? | If they give away the comparison surface, our free layer must look different | Download the report; compare its city tables against our planned layout | **Not resolved** |
| Q6 | Do state policies (UP/Gujarat/Kerala/TN) have **rules files** or implementation notes we haven't reviewed? | Subsidy eligibility in practice matters more than the policy PDF | Each state's IPA portal (Invest UP, Gujarat DST portal `dstpolicy.gujarat.gov.in`, Kerala IT Mission) | Partial — UP and Gujarat portals located; Kerala draft policy PDF accessed via itmission portal; *all* files reviewed only at summary level so far |
| Q7 | Does the MeitY national framework (S07/S34) eventually contain a tiering/telemetry requirement that would make our definitions normative? | If it does, we should align our schema before Phase-2 build | Follow-up reading of the draft framework once published | **Not resolved — flagged** |
| Q8 | Are CBRE/JLL numbers "quoted-base" or transaction-level (differs from what people assume)? | City-vs-city rent comparisons must be strongly caveated if quoted-only | Read the full CBRE/JLL monthly/quarterly office PDF (S20-24) and note their own caveats | Partial — CBRE states quoted-rent caveats in their own docs; captured in register limits, not fully QA'd |

## 2. Assumptions we are making (to be deliberately broken later)

- **A1.** Press coverage of Nasscom–Zinnov (S02, S03) is faithful to the underlying report figures (R1 of 2 anchors).
- **A2.** The Karnataka/TN/UP/Gujarat/Kerala policy figures cited from official PDFs are current as-of reading date (S05, S06, S10, S13, S16).
- **A3.** CBRE city-level GCC leasing is a *good enough* demand proxy for a prototype callout (not for the final product's pricing logic).
- **A4.** Our prototype-in-a-week data quality is demonstrable with far fewer companies in-scope than 2,117 + full policy maze (Phase-2 will set a scope statement — likely covering 6 hub cities + 4 tier-2 polices).

## 3. Risks table

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GCC Atlas name unavailable / challenged (S38) | Medium | High (public-facing) | Rename in the worktree (cheap at prototype stage); run trademark check before any public post |
| GCC Explorer releases a free comparison layer | Low-Medium | Medium | Our differentiator must go beyond "free": provenance + ~methodology + tier-2 focus |
| Cited reports (S01/S02) figures change between FY cycles | High | Low | Every stored figure carries `verified_date`; refresh cadence in Phase-2 |
| One of the state policies (e.g., Kerala draft S16) is revised after public consultation | Medium | Medium | Label draft-vs-final states with status field; only `final` may be presented as actionable |
| Fictional/press sample numbers enter the seed dataset unnoticed | Medium | High | Phase-2 QA: seed-time lint — a value without source-ID fails the build (continues existing provenance policy) |
| Survey user-base fatigue from appearing to "sell" during prototype stage | Low | Medium | Positioning copy review before public posting; mark what is clearly pre-alpha |

## 4. What does NOT need solving to proceed

- Market size discrepancy Wizmatic vs Nasscom–Zinnov (documented in market-research.md §3; not a product decision, it's a citation decision).
- Whether GCC Explorer has saturated X% of segments — unknowable from public data; logged, not chased.
- Global (non-India) GCC breadth — `gcc-atlas.com` covers that angle (S38); out of our current scope.

## 5. Phase-2 gate list (what must exist before we call the build "validated-informed")

1. Q1, Q5 resolved (GCC Explorer methodology + their free report read).
2. Target-segment hostnames listed (even unreachably cold) in a CRM tab — no invented contact names.
3. Data schema updated: `status` field on policies (`draft`/`final`), `counting_basis` on counts, `disputed_with` on figures with conflicts found.
4. Two sections (market-research §3 conflicts, this file) re-verified at the same time window against the live sources.

---

*Prepared 2026-10-19.*
