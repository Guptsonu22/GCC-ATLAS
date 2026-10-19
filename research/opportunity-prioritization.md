# GCC Atlas — Phase 1 Opportunity Prioritization

Close of Phase 1: what to build (and, importantly, what to **not** build first), recommended starting segment + primary use case, and the cultivation plan for the debate. All evidence from `source-register.csv` IDs.

---

## 1. Scored opportunity matrix

Scale: **TAM evidence** (does it exist & is it monetizable today), **underservedness** (how badly products leave this gap), **data feasibility with public sources only**, **prototype fit** (buildable in React+Node for an internship evaluation), **risk** (external shocks, name/legal concerns). Scores are 1–5; the weights are: TAM 20%, underservedness 30%, data feasibility 25%, prototype fit 15%, risk 10% (risk subtracts).

| # | Opportunity | TAM | Underserved | Feasible w/ public data | Prototype fit | Net score | Rationale |
|---|---|---|---|---|---|---|---|
| O1 | **GCC company directory + search/filter** (BFSI/tech/hub taxonomy, verified fields w/ provenance) | 5 | 3 | 5 | 5 | **4.30** | GCC Explorer already monetizes $3.5K–$10K (S30). Our angle is "free + provenance-only," but a directory alone is the most-copied product surface. |
| O2 | **City-atlas / location-comparison dashboard** (talent + policy subsidies + rent + peer counts per city, side-by-side) | 4 | **5** | 4 | 5 | **4.40** | 8+ state policies normalize into comparable rows (S05-S19); CBRE city-noted GCC absorption base exists (S20-24). No one currently shows this side-by-side with unit-denominators laid out. |
| O3 | **Policy & incentive tracker** (cross-state matrix; employment subsidy/payroll/L1-vs-advanced thresholds, standardized vertex rows) | 3 | 5 | 5 | 5 | **4.15** | Policy papers are public and parseable; direct ambiguity risk minimal if we cite G.O. PDFs verbatim (S06, S10, S13). Alone it feels too "excel-grid" for a showcase, hence slightly below O2. |
| O4 | **Watcher / jobs monitor — spikes, watchlist, alerts** (like GCC Explorer 360 watchlist) | 4 | 2 | 2 | 2 | **3.30** | Already exists, refined, & priced (S30/S32); needs continuous data ingestion we can't reliably volunteer to build with pure public sources. |
| O5 | **Compensation-bands library** (functional bands per city GCC vs IT-services) | 4 | 3 | 2 | 3 | **3.60** | Great story (S25-29) but data license / scraper-fitness issues; Phase-3 candidate. |
| O6 | **GCC Explorer vs GCC Atlas branding + leadership contacts resale** | 1 | 1 | 1 | 1 | **1.40** | No headroom; plus name-litigation exposure; skip. |
| O7 | **GCC hiring / outcomes "AI shift" special report** (viz of the AI-role premium) | 3 | 2 | 3 | 4 | **3.10** | Publication-mode differentiation; fine as a "week-3 content tactic", weak as a core product hook (S26-29). |

**Winner: O2 — the City Atlas/location-comparison surface — with O1 (directory) and O3 (policy tracker) as supporting modules inside it.**

## 2. Recommended initial customer segment

**Primary: MNC expansion decision team** — the desk that decides *where in India* the next capability centre goes (segment A in `stakeholder-map.md`). Evidence support: they alone generate 37–45% of national office absorption (S20–S24), they've been shown to pay for location intelligence (CbRE/JLL/Zinnov rows, S01/S02/S24), and GCC Explorer's $5K–$10K lines show the class of buyer has budget for data (proxy).

**Secondary (first-served, because reachable): state/metro IPAs and global providers** — B and D segments. They self-identify (public sites), the second group already pays for comparable products (S30), and both classes are legitimately pleased to see a free, credible reference source. They are our **content-catalysts** — they share, price-check, and triangulate us, without needing us to prove track record to them first.

## 3. Recommended primary use case (the core UX bet)

> *"Compare candidate cities for a new GCC — across talent, paid/policy incentives, real-estate cost signals, and sector-peers — for a specific function (e.g. BFSI-ops, AI/ML, engineering design) — with every number carrying its counting denominator and its source."*

Implementation relevant to the existing build (already working in-repo):
- The **Explorer/Cities/Providers/Assistant pages** we have should foreground the comparator: pick IF (function) + constraints (tier preference, subsidy type) → ranked city cards with a provenance badge per figure.
- The **policy tracker** arrows into this UX (per-city incentive rows) rather than being a separate page.
- The **AI assistant** answers use-compound-type questions: *"Which tier-2 states subsidize BFSI jobs above ₹1L/month?"* → answered with cited rows from the policy base (verifiable against G.O. PDFs, S06/S10/S13).

## 4. Why not lead with the broader "directory of all 2,117 GCCs"

- **Unfavorable data feasibility ranking:** Our options for "list all India GCCs" authority are contested-against GCC Explorer (S30). Beating them on coverage breadth with zero private data is not credible for a prototype. Being more disciplined about the *subset we cover*, and authoritative on the *decision layer above it*, is credible.
- **Usage criticism:** a directory alone does not answer "what will it cost to enter city-X with subsidy-Y if my unit is L1 vs Advanced" (S10 rows; S13 rows) — which is the actual caregiver question real decision teams ask.

## 5. What we must do in Phase 2 (build implications, not marketing)

1. **Data layer:** normalize 6–8 state policies into one `policies` table schema (subsidy type, % bands, eligibility criteria, required thresholds, effective year, G.O.-or-policy-PDF reference URL). Already partially seeded — align against newly-verified figures (S10, S13, S16-18) so the build does not encode pre-research figures.
2. **Denominator discipline:** every headline must carry a "978 parent GCCs vs 3,728 delivery units (FY2026)" count; both are non-anomalous. Enforce a "definition" cap in the UI headline tile ("GCC = delivery units >30 headcount, Nasscom–Zinnov definition").
3. **Assumption/G.O. stagger:** never store a policy claim without: state, scheme name, effective date, eligibility rule, and source URL. Conflicting claims (e.g., Wizmatic, S04) enter the DB as "disputed" with both numbers, not as the truthier-sounding one.
4. **Name risk:** prototype can proceed under "GCC Atlas"; if we go public at the close of the internship exercise, run a trademark/limited-availability check (S38 shows a live-in-market foreign-bound GCC-platform using the same name).
5. **Avoid inventing interviews:** Phase 1 validation must be conversation-audit-based (e.g., use ETGCC's commentary, NASSCOM GCC summit themes S12/S18/S27 — nothing we don't have evidence of being talked about in the market).

## 6. What would falsify this direction

- If a target user revealed (in a real interview, at Phase-2 kickoff) that city comparison was solvable in-house with a one-week spreadsheet, map-of-it as we know it is shaky, and we pivot to the **watchlist/alert** use case (O4).
- If GCC Explorer or another player combed a "free comparison view" in front of us with hard-to-repeat sparsity, the free-decision-layer thesis weakens in turn.

---

*Prepared 2026-10-19. The next phase must register assumptions before the platform is presented; see open-questions.md.*
