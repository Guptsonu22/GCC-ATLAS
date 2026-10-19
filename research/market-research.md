# GCC Atlas — Phase 1 Market Research

Finding: the market (India GCC ecosystem) is large, fast, and **definitionally messy** — three different counting regimes (parent-direction, `GCC` vs `GCC unit`, hub-city vs dispersed) produce apparently conflicting headline numbers. This memo records verified figures, discrepancies, and what they mean for product positioning. Every claim carries a source ID pointing to `research/source-register.csv`.

---

## 1. Market size & growth (verified)

| Metric | FY2023 | FY2024 | FY2026 | Source |
|---|---|---|---|---|
| GCCs (parent-level) | ~1,600 | 1,700+ | 2,117 | S01, S02 |
| GCC units (delivery locations) | — | 2,975+ | 3,728 | S01, S02 |
| Talent employed | 1.66M | 1.9M+ | 2.36M | S01, S02 |
| Revenue | ~$46.1B | $64.6B | $98.4B | S01, S02 |
| Tier-2/3 talent | — | ~82–88K | — | S01 |
| Forbes G2000 parent count | — | — | 506 | S02 |

Cross-checks: Reuters (S02) and Times of India (S03) agree on FY2026 Nasscom–Zinnov figures to the last digit (2,117 GCCs; 3,728 units; 2.36M talent; $98.4B). Nasscom–Zinnov projects 2,100–2,200 GCCs / $99–105B by 2030 (S01 context) — meaning the FY2026 *estimates* may be running ahead of the earlier 2030 projection.

## 2. Definitional heterogeneity (core finding)

**"GCC" vs "GCC unit" is the market's central counting ambiguity.** Nasscom–Zinnov counts units (2,975 in FY2024 > 1,700 parent GCCs); Zinnov's parent-direction floor is ~30 headcount per facility. This means daily numbers reported in the press (~1,600 in some use cases, ~1,760 in others, 2,117 in FY2026 reporting) **may not actually conflict — they count different things at different floors**. Productizable finding: GCC Atlas must always show its **counting denominator** (units vs parents vs G2000-only etc.) next to any total.

## 3. Documented conflicts (do not silently pick)

1. **Nasscom–Zinnov vs PIB/Trade bodies.** PIB (S08) in Dec 2025 says "over 1,700". Trade-body figures may lag official report; or PIB uses a narrower denominator (parent direction); or a snapshot a year older than the latest. **Action:** when our platform presents a total, use Nasscom–Zinnov definition as primary and explicitly annotate the alternate public figure with a count-date mismatch attribution note.
2. **Wizmatic (S04)**: $164B revenue / 4.2M employment for FY2026 — a near-doubling over Nasscom–Zinnov's $98.4B / 2.36M on identical time-period claims. **Assessment:** likely different inclusion boundaries (perhaps including ESOPs/parents' India entities counted differently, or an intended-definition rather than actuals — the summary-methods snippets retrieved do not disclose unit definitions). **Action:** register as conflict, not as fact.
3. **Kerala's own targets moved.** Draft (S17): 40→120 GCCs by 2030 + 200K jobs. Later 'Kerala GCC Outlook 2026' (S18): 45→150 GCCs / 2 lakh jobs by **2031**. **Action:** cite both, label years, and never blend to 150-by-2030.

## 4. Demand-side evidence

### 4.1 Office space (best available demand proxy — verified independently of government reports)
- GCCs leased 29.2 mn sqft in 2024, +29% YoY (S24).
- 2025: record 82.6 mn sqft national leasing; **GCCs are 39% of 2025 absorption** (S20/S23), 45% in Q1-2025 (S22), 39% in Q3 (S21), and CBRE predicts GCCs will take **~35–40% of 2026 absorption** (S20).
- City-level (S20, Q4-2025): Bengaluru 44% of GCC leasing; Hyderabad 25%; Delhi-NCR 13%.

**Implication:** the product's demand signal is strong and fresh — the GCC establishment decision is visible in office leasing, not only in reports on builds.

### 4.2 Compensation (why GCC roles are attractive and GREMLINnable)
- TeamLease Digital (S25/S28): **GCCs pay 12–20% above IT services** at entry/mid; skill-specific premiums wider at senior levels; gender pay gap 10–17% generally, 22–30% in data-analysis roles.
- NLB Services (S26): expected 9.8% salary growth next 12 months; AI/ML roles forecast +30–50% vs traditional IT; `fresher` gender-pay gap needs attention.
- CIEL Works / Taggd / ANSR Research / Deloitte (S27/S29): premium range **8–30%** depending on function; specialist AI/cloud/cyber/semiconductor/PM/data roles 15–40% above equivalent IT-services roles; niche digital hires command **30–45% transition hikes**; mid-career AI/platform roles cluster at **₹35–60 LPA**.
- Freshers: GCC AI/GenAI median 7–8 LPA vs 5 LPA in IT services (S29).

**Cross-source agreement:** premium range is consistent across TeamLease (2024), CIEL (2025), Taggd/ANSR/Deloitte (2025–26). **Implication:** compensation is a real, multiple-source-confirmed differentiator — good material for a "premium by city/function" metric if GCC Atlas surfaces compensation bands; but data-licensing cost will be the constraint, so treat as a Phase-3 candidate.

### 4.3 Talent composition
- GCC workforce concentrates in **mid-to-senior (3–8 years' experience)**: 63% (2023) → 77% (2025) (S27, CIEL Works; S29 TeamLease corroboration).
- GCC fresher hiring is targeted rather than volume: ~400K cumulative by 2030, 130–140K annually (S29).

## 5. Supply-side / policy (national + states)

- **Union Budget 2025-26 (S07):** National Framework for GCCs proposed to guide states on tier-2 promotion — 16 measures incl. talent pipeline, infrastructure, byelaw reforms, industry collaboration.
- **MeitY industry committee (S34, May 2025):** Nasscom/Zinnov/ANSR/KPMG (inter alia) convened for tier-2 / emerging-city framework; talent map + infrastructure audit + byelaw modernization on the table.
- **Karnataka GCC Policy 2024–29 (S05):** +500 new GCCs → 1,000 total; 3.5 lakh new jobs; $50B output; Global Innovation Districts; innovation fund; AI CoE; beyond-Bengaluru subsidy design.
- **Tamil Nadu G.O. (S06):** payroll subsidy 30/20/10% for years 1–3 against jobs paying >₹1 lakh/month; eligibility hooks: Forbes Global 2000 / Fortune 1000 / 200+ jobs; states Coimbatore + Madurai as facilitation targets.
- **Uttar Pradesh GCC Policy 2024, finalized May 2025 (S10, S11):** 2 lakh jobs target over 5 years; 30–50% land subsidy; 100% stamp duty exemption; 25% capital subsidy (₹10cr L1 / ₹25cr Advanced); SGST reimbursement; 5% interest subsidy; OPEX up to ₹40cr (L1) / ₹80cr (Advanced); ₹20,000 incentive per UP-domicile fresher; IPR ₹5–10 L. Satellite offices for tier-2; outpost/cluster offices for tier-3 (per draft S09).
- **Gujarat GCC Policy 2025-30 (S13, S14, S15):** 250 new units; 50K jobs; ₹10,000cr investment target; one-time employment assist (50% one-month CTC, caps ₹50,000 male / ₹60,000 female after 12 months); 7% interest subsidy (cap ₹1cr); EPF reimbursement (100% female / 75% male, 5 yrs); electricity-duty reimbursement; skill reimbursement up to ₹50,000/course; 25% CAPEX + 15% OPEX per GIFT-City deck; GIFT City IFSC: 10-year tax holiday, no GST, IC entity advantages.
- **Kerala Draft GCC Policy 2025 (S16, S17, S18):** "GCC Boilerplate" support model; SPOC teams in Technopark TVM + Infopark Kochi; target 45→150 GCCs by 2031 (from the Outlook 2026 report; draft earlier targeted 40→120 by 2030). EoIs signed at Davos (S19).

**Common denominator read:** 8+ states are running active GCC-acquisition playbooks, all of which target the same growth vector — **expansion into cities beyond the traditional 6 hubs**. This generates two cross-cutting product opportunities: (a) a single **city-model comparator** (rationale: today the comparison work is done manually by consultants) — mask absent state policies as "field not yet available" rather than zero; (b) an **incentive-legality / field-tracking layer** (multiple similar-sounding tables to normalize).

---

## 6. Micro-conclusions the product should reflect

1. **Anchor the headline number to the counting denominator** (parents vs units), and to Nasscom–Zinnov when national. Never mix Nasscom–Zinnov's definition with Wizmatic's, PIB's, or STPI's.
2. **Demand-side evidence from CBRE leasing and compensation data triangulates the ecosystem maturity**, so the product's buyer (consultant / leader / investor) doesn't need us to prove "GCCs are growing" — that thesis is settled. They need us to answer **where next, what will it cost, and which policy/landlord frontier is open**.
3. **Tier-2 is not a hypothesis** — it's already encoded in the Union framework (S07/S34), in 8+ state policies with explicit tier-2 targets (S05/S06/S10-S19), and in CBRE's GCC-office-absorption behavior (S21: Bengaluru+Pune+NCR take 67% of GCC leasing, with Pune at ~25% of Q3-25 GCC leasing — i.e., non-Bengaluru cities are already significant).
4. **Fresher-heavy hiring maps to IT-services thinking; GCC-specific hiring maps to specialization.** Product headline "AI roles will pay 30–40% more than equivalent non-specialist roles" is supported consistently enough (S26/S27/S29) to put on any compensation-related surface, but data must not be silently averaged with older IT-services benchmarks.

## 7. Known gaps in our current evidence base

- India may require **longitudinal** data on the same set of GCC openings to compute a churn/retention metric — not available in what we've collected so far.
- GCC Explorer (S30–S32) self-reports 1,680+ GCCs similarly scoped, so coverage overlap is real. We have **not yet surveyed whether GCC Explorer prices exclude tier-2 cities** or model policy-incentive comparison as a first-class field (their published tier names free features do not mention policy comparison; their own FAQ not reviewed).
- No independent source surfaced for a **GCC-vs-IT-services turnover** comparison. Bottleneck considered non-critical for the Phase-1 deliverables; Phase-2 validation interviews should include one attrition-angle question to each stakeholder; if unavailable, mark extension as "unknown" rather than estimate.

---

*Prepared 2026-10-19. All figures cite the IDs above; see `source-register.csv` for publisher, dates, scope, and limitations. Confidence is recorded per-source. Estimations are explicitly labeled `estimate`/`Projection` in their source cell or footnote.*
