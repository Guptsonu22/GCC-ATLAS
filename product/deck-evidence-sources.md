# GCC Atlas Strategy Deck — Evidence Sources

Every quantitative claim in `product/deck/gcc-atlas-strategy-deck.pptx` traces to one of the sources below (IDs as registered in `research/source-register.csv`, which carries publisher, URL, publication date, verification date, scope, confidence, limitations and conflicts for each). Deck literals that are NOT market facts are tagged inside the deck itself as `[proposal]`, `[inference]`, or "tracked dataset".

| Deck slide | Claim | Source ID(s) | Publisher | URL |
|---|---|---|---|---|
| 1, 2 | 2,117 GCCs (parent-level) FY2026 | S01, S02, S03 | Nasscom & Zinnov (via Reuters + TOI cross-check) | media.zinnov.com · reuters.com · timesofindia.indiatimes.com |
| 1, 2 | 3,728 GCC units FY2026 | S01, S02 | Nasscom & Zinnov | media.zinnov.com |
| 1, 2 | $98.4B GCC revenue FY2026 | S01, S02, S03 | Nasscom & Zinnov | media.zinnov.com · reuters.com |
| 2 | "over 1,700" count mismatch | S08 | PIB | pib.gov.in |
| 2 | $164B / 4.2M conflicting estimate (shown as a conflict, never averaged) | S04 | Wizmatic via The Statesman (low confidence) | unverified URL — registered as conflict only |
| 1, 2 | GCCs = 39% of 2025 office absorption; 2025 record 82.6 mn sqft | S20, S21, S22 | CBRE | cbre.com |
| 2 | GCC office leasing 29.2 mn sqft 2024 (+29% YoY) | S24 | CBRE | cbre.com |
| 2 (footnote via product copy) | GCCs pay 12–20% and 8–30%+ vs IT services; AI/ML +30–50% premium | S25, S26, S27, S29 | TeamLease Digital / NLB / CIEL / Taggd (press) | rediff.com · newindianexpress.com · etgcc.com · economictimes.com |
| 3 | 8+ states run GCC acquisition playbooks | S05, S10, S13, S16 | Govts of Karnataka, UP, Gujarat, Kerala | eitbt.karnataka.gov.in · invest.up.gov.in · cmogujarat.gov.in · itmission.kerala.gov.in |
| 3, 6 | TN payroll subsidy 30/20/10%, >₹1L/month; UP ₹20,000/fresher | S06, S10, S11 | Tamil Nadu G.O.; Invest UP; Economic Times | tnswp.com · invest.up.gov.in |
| 3, 10 | Provider BD class pays $3.5K–$10K cycles (GCC Explorer pricing ladder) | S30, S31 | GCC Explorer / AIM Research | gccexplorer.com (pricing + press kit) |
| 3 | AIM watchlists purchased by enabler class | S32 | AIM Research | aimresearch.co |
| 4 | GCC Village row-level coding inconsistencies (~473 Hyderabad vs ~100 Bengaluru) | S35 | GCC Village | gccvillage.com |
| 4 | Historic static lists once sold $9,999–$12,000 | S33 | STPI-report echo (ETGCC) | etgcc.com |
| 5 | Name collision: gcc-atlas.com exists | S38 | gcc-atlas.com | gcc-atlas.com |
| 12 (roadmap) | Trademark gate (S38); union framework tailwind | S07, S34 | PIB; MeitY committee | pib.gov.in |
| 7, 8 | Product dataset counters (46 tracked GCCs, 12 cities, 36 sources, 17 providers, 11 sectors) | **Tracked dataset** (the app's own DB, `backend/data/gcc-atlas.db`; seed = `backend/src/data/seed-data.ts`, provenance `data/data-dictionary.md`) | GCC Atlas prototype | `GET /api/dashboard/stats` |
| 10 | H2/H4/H5 price anchors as market-reference ceilings | S30, S31, S33 | (as above) | (as above) |

## Deck content that is explicitly NOT evidence-backed
- Business-model pricing (H2/H4/H5): `[proposal]` hypotheses — unvalidated; anchored to S30/S31/S33 market comparables as ceilings only.
- Persona details & success metrics (M1 <10 min, M3 ≥40%): `[proposal]`/`[inference]` — composites from Phase-1 evidence; no interviews were conducted or implied; instrumented to be falsified/validated in Phase 3.
- Opportunity scores: method + rubric transparently documented in `research/opportunity-prioritization.md` (internal analysis, weighted model, not a market measurement).
- The deck does not fabricate revenues, users, customers, or market validation of the product itself.

## Scope note
`research/source-register.csv` contains 39 verified entries; the deck uses the subset above. Conflicting sources (S03 vs S04; S17 vs S18 Kerala targets) are deliberately **co-presented in the product UI** and summarized as conflicts in the deck rather than silently resolved.
