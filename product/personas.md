# GCC Atlas — Personas

*One primary persona is designed for. Two secondary personas are served but not designed-for in v1. Profiles are composites constructed from Phase 1 evidence (`research/source-register.csv` IDs); they are NOT descriptions of specific real people, and no interviews were fabricated to create them. Everything not anchored in evidence is marked **[inference]**.*

---

## 1. Primary persona — "Priya Raman", Location-Strategy Lead, MNC expansion team

### Snapshot
| Attribute | Value | Basis |
|---|---|---|
| Role | Leads location strategy & business case for India capability-centre expansion within an MNC's corporate development / India initiative team | Segment A is the desk assembling city shortlists (stakeholder-map §2) |
| Type of decisions | New GCC entry city; expansion of existing centre; function relocation; second-centre evaluation | U.S./global firms drove 37–45% of recent India office absorption and 64% of GCC space take-up (**S20**, **S21**, **S24**) — market where such roles exist |
| Goal | Defensible, definition-clean city shortlist for a specific function, fast | The market's numbers are definition-messy (**S02** vs **S04** vs **S08**) — a "defensible" artifact must carry denominators and citations |
| Environment | Works with: parent-side leadership (CFO/commercial), CBRE/JLL/Zinnov consultants, state IPAs | IPA outreach evidence (Invest UP at NASSCOM summit, **S12**); consultancy drafting pattern (**S01**, **S24**) |
| Tools today | Excel + brokerage/consultant PDFs + state policy PDFs + press releases | Fragmentation documented across 8 policy formats (**S05–S19**) |
| Time horizon when engaged | Mandate to site decision in ~3–9 months **[inference]** | Triggered by parent mandate / lease cycle / peer move per PRD §2.3 |
| Skill level | Strong Excel; reads policy G.O.s but not their native language of thresholds; would rather not hand-amortize subsidy tables | **[inference]** |

### Jobs-to-be-done (ordered)
1. **Frame:** translate the headcount-mandate into city criteria (function, tier preference, cost ceiling).
2. **Shortlist:** get ranked candidate cities with talent/cost/incentive/peer facts.
3. **Defend:** produce a comparison that survives CFO + consultant scrutiny — with citations.
4. **Act:** know exactly which IPA contact angle or subsidy applies if the shortlist holds (e.g., UP's ₹20,000/fresher, **S10**; TN's 30/20/10 band, **S06**).

### Motivations / fears
- **Motivation:** be the analyst whose diligence is airtight; save weeks of assembly; avoid embarrassing definitional errors (e.g., mixed counts).
- **Fears:** data errors surfacing late; "why is this number different from Zinnov's?" in a review; sunk weeks with nothing to show; a broker- or consultant-driven echo chamber ("which city do they want to place us in?").

### What she'd say at evaluation
- If someone asks why she doesn't just use GCC Explorer: "It's a phone book — good contacts and coverage, but it doesn't compare cities or normalize subsidies for my case" **[inference on narration; capability gap is documented: GCC Explorer sells contacts/watchlists/jobs intelligence, **S30**, not city-policy comparison].**
- She would likely pay *only after* the free tier earns trust once — **[inference]**.

### Success looks like (v1)
One working session, maximum one page of Excel dependency in her notes, with per-figure source provenance.

---

## 2. Secondary persona — "Rakesh", Investment Promotion / Policy Officer, State IPA
*Valuable for distribution; depiction ~ same evidence base as Priya's; tagged per item.*

- **Role:** Bureau/desk promoting the state's GCC-acquisition playbook (8+ states run these now — **S05**, **S10**, **S13**, **S16**).
- **Goal:** Compete vs peer states with hard numbers instead of slogans; show where their policy matches the mandate of target companies (Compare — UP vs Gujarat vs Kerala on salary bands + employment-duration thresholds).
- **JTBD:** Have a *shareable neutral page* they can send to a prospect with their state positioned fairly vs competitors — without paying Zinnov for positioning.
- **Fear:** Numbers shown by a third party that paint their state unfavorably — so "both-conflicting-numbers-visible" rendering keeps them using it (**S02** vs **S04**).
- **What v1 gives them:** free, cited compare-link (with known limits — they won't share a product whose assumptions they can't audit).

## 3. Secondary persona — "Maya", Enabler/provider BD lead (real-estate advisory, setup consultancies, recruiting)
- **Role:** Sells implementation services (site selection, legal, payroll, recruitment) into GCC formation/expansion.
- **Goal:** Identify *ready-to-engage* demand signals.
- **Fits the market evidence:** GCC Explorer charges the segment $3.5K–$10K for exactly these lead surfaces (**S30**/**S31**) and AIM's watchlists are purchased by this class (**S32**).
- **JTBD (v1):** Personally verify a market claim before a client meeting — nothing beyond what persona 1's views give.
- **What v1 explicitly withholds:** pipeline/watchlist, personalized outreach lists, paid positioning. v1 will not ask Maya to pay — she is a Phase-3 monetization surface (business-model.md §5) whose trust relationship is being cultivated.

---

## 4. Anti-personas (used sparingly)

- **Devin, a curious candidate/employee** — comes from ads to look up salaries; no goal in our JTBD; blocked by design from a paid/free tier surface spending.
- **Zeke, a competitor scraping** — not served by v1; read-only events instrumentation and open-linter approach keep him from biasing our metrics.

---

## 5. Design implications for the inventory (what changes in the product)

- **Denominator-translation** (Priya's #1 review risk — from S02/S04/S08 conflict precedent) → every numeric surface labels its counting basis.
- **"Field not yet available" ≠ 0** for missing metrics—Kerala validated targets variants are Strawlabeled (**S16–S18**).
- **Citation one-click-away** → provenance chip component everywhere a number appears.
- **Conflict renderer** when both numbers exist (e.g., PIB vs Zinnov Fig.) → discussion-invitation, not decision-correction.
- **No bulk exports and no bulk contact data** in v1 → wave that touches persona 2 without triggering persona 1's mimicry-driven data hoarding.
- **Draft/final status on all policies** → protects persona 1 from putting a draft policy in her deck (e.g., Kerala, **S16**).

*Prepared 2026-10-19. Compressed artifact by design; the granular event/feature implications target `user-journeys.md`.*
