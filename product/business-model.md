# GCC Atlas — Business Model

*Everything in this file is a **hypothesis or design decision**, not a validated fact. Pricing levels are unvalidated **[proposal]** until instrumented (§6). Monetization-by-provider is additionally constrained by a trust analysis (§4) before it is recommended.*

---

## 1. Value exchange thesis

| Who | What we give free in v1 | What could later be paid for | Why this ordering |
|---|---|---|---|
| Expansion-decision teams (primary persona) | Full city compare + policy matrix + source register | Monitoring/alerts, team workspaces, exports, deeper data partnerships | They need trust before budget; paying for data pre-trust kills the wedge |
| IPAs / policy watchers | Full **state policy matrix** + compare links | Not for payment in v1 — they are *distribution catalysts* | Sharing by IPAs makes the free tier reach persona 1 (upstream demand) |
| Providers (persona 3) | Verified-but-neutral listings coverage | Verified-profile enhancement (§5) — later | Their monetization exists in-market (**S30** sells to exactly this class) but conflicts with our neutral positioning if wired early |
| Talent/candidates (F) | Open read access | Nothing (won't) | No trainable JTBD; retention spiky and demographic-hyped noise |
| Investors / REITs | Free ledger where relevant | White-glove reports (Phase 4 candidate) | Wrong buyer this cycle |

**Thesis:** build reputation density first (free-instrumented), sell *convenience and continuity* later — never sell *rankings* — because the founding thesis is evidence-first provenance (competitive-landscape §6; trust contract in positioning.md §2).

---

## 2. Monetization options evaluated (assignment requirement)

| Option | Evidence for | Stress-test / conflicts | Verdict |
|---|---|---|---|
| **(a) Subscriptions (self-serve seats)** | Strong analog: GCC Explorer charges $3,500–$10,000 per seat-half-year or year and a 15-company free preview (**S30**) | WTP for *our* subset unproven **[inference]**; copycat-resistant only via trust | **H2 — lead hypothesis after free-traction gate** (§6) |
| **(b) Premium intelligence reports** | Market precedent: free quarterly "State of GCCs" exists (**S31**), older static lists once sold $9,999–$12,000 (**S33** archive); inside-NLB/CIEL reports circulate as lead-gen (**S26**, **S27**) | Content is costly to do authoritatively; risk = report cannibalizes tool | **H4 — Phase-3/4; one free report first to establish standards** |
| **(c) Team workspaces** | Tool-category convention; no custom evidence needed | Premature pre-seats (account/multi-tenant cost); risks engineering dilution | **H3 — Phase 4, only if H2 clears** |
| **(d) Provider subscriptions** | Segment proven-payer (**S30**/'Connect' tier: leadership contacts) | **Conflicts with neutrality** if ranking-adjacent (detail §4); verified-profile benefits are compatible if structured right | **H5 — Phase 3/4 under strict neutrality design (§5)** |
| **(e) Qualified introductions (referral fees)** | Standard in brokerage/consulting ecosystems; providers already pay for introductions (**S30** Connect tier is conceptually adjacent) | **Highest trust corruption risk** (§4); only defensible as opt-in, no-in-ranking, disclosed | **H6 — gated; default NO in v1** |

---

## 3. Pricing hypotheses (proposed, to test — §6)

Anchor facts from the market: comparable products at **$3,500–$10,000** per-seat cycles (**S30**); historical static list price **$9,999–** (**S33**); free tier in market = 15 members (**S30**). These anchors set a *ceiling* reference, not our price.

- **H2a — Pro individual: $99–$199/yr** (self-serve desk 用途; ≈ 3–6% of the alternate tool's annual per-seat). Features: unlimited saved comparisons, share links, export, policy-change email alerts (once F17 re-enters), priority support.
- **H2b — Team: $500–$2,000/yr per 3–5 seats** with shared saved sets, audit-tagged org notes. ∆ price-fat vs. team adoption **[proposal]**.
- **H4a — Report: $0 (free standard quarterly) / $299–$499 one-off thematic deep-dive** once publishing muscle exists.
- **H5a — Provider Verified profile: $199–$499/yr**, strictly non-ranking (§5).
- **H6a — Introduction success fee: "fee disclosed to both parties" model** (never hidden, ranking-neutral) — default OFF; only revisit if H2 underperforms but pipeline demand exists.

## 4. Trust & conflicts-of-interest analysis (REQUIRED — before provider monetization)

Ironclad positioning assumption: **"trust" is the product feature that differentiates** (competitive-landscape §6, methodological messiness findings §2; GCC Village's inconsistent rows undermine the same value proposition we supply — **S35**).

| Monetization mechanism | Creates conflict because… | Verdict under our trust thesis |
|---|---|---|
| Paid prominence / higher rank in directory or compare results | Providers influence the evidence layer; corrupts the neutrality that qualifies our data | **BANNED forever** — in any product surface that displays market numbers |
| Sponsored "success stories" inside workflow | Ghost-authored Trusted content within a factual product | **BANNED** (separate contents channel OK — clearly editorial) |
| Paid verified badge (vendor list insertion) | Creates a stranger-to-issue valid badge; contradictory to neutral listing object | **H5 allowed (strict §5 rules)** |
| Lead-gen/qualified introductions with fees | We get paid per provider chosen; the "neutral shortlist" becomes bundling | **Only with (i) user-initiated opt-in per introduction, (ii) providers cannot pay to enter the introduction queue, (iii) ranking and tool surfaces remain independent of commercial ties, (iv) 100% disclosure.** Default OFF in v1 |
| Data sales to provider firms | Selling what users generate or our own curated data | Allowed (Phase 4) at aggregate level; never user-identifying data |

**Net provider monetization recommendation (rev. to PRD §2.10 H-P5):** do **not** open provider revenue in Phase 2. Phase 3 gate: **every provider-facing revenue feature must satisfy the "would this survive my having to publish our conflict register?" test** — i.e., publicly displayed "how we make money" page (see positioning.md §2 contract).

## 5. If/when provider subscriptions happen (design, pre-committed)
1. **Verified-Profile** = third-party-verified attributes only (founded year, offices, case studies with client citations). Not an ad badge.
2. Same *source rules* as cities/companies: unverifiable claims aren't published.
3. Zero influence on: search ranking, compare tables, city metrics, assistant answers.
4. Not disclosed anywhere as "premium partner" *in* the factual surfaces; a single "About listing" chip is permitted on the provider's own page.
5. An independent "how listings are ranked" page states ranking is only activity + completeness; paid status never touches output order.

*(This section exists so the growth team cannot quietly rewire the marketplace later — the conflict protocol is (should be) written down before money enters.)*

## 6. How the pricing would be tested (assignment requirement)

No invoices are scraped for Phase 2. **Pricing validation plan:**

| Test | Mechanism | What counts as passing | Notes |
|---|---|---|---|
| T1 — behavior gate (pre-req) | Free tier live; instrumented compare-create & reopen events | ≥ threshold in success-metrics (M3/M4) across ≥ 40 unique visitors [**proposal** threshold] | If T1 fails, pricing tests pause — value isn't proven |
| T2 — Fake-door pricing screen | Labeled "planned pricing" page with H2a/H2b bands; captures email + price reaction split | ≥ 10% of T1 survey opt-ins express interest at H2a [**proposal**] | Ethics: clearly marked planned, not purchasable |
| T3 — Van Westendorp-lite | 4 questions in first 5 user interviews (real, not fabricated) | Price band intersection sane relative to H2a | Phase 3 |
| T4 — Waitlist co-contract | "Pay $1 refundable deposit to be first in line" | ≥ 5% of waitlist converts to $1 [**proposal**] | Cheap WTP signal, common early-tool heuristic |
| T5 — Competitor price relativity | Track GCC Explorer pricing pages quarterly | Our angle unchanged if competitor price shifts | Registry-level maintenance |

Only T1+T2 are Phase-2 scope. T3–T5 are Phase-3.

## 7. Honest cost/feasibility notes
- No paid-data licenses in v1 (budget risk per S25–S29 salary premium; the **deterministic demo assistant** costs $0 at scale and becomes the trust feature).
- Deployment: targeted PaaS free/low tiers; costs to stay < $25/mo baseline until H2 test clears [**proposal**].
- No paid media in Phase 2; all acquisition is organic/developer-community shareable links (GTM=content-catalyst, PRD §2.9).

*Prepared 2026-10-19 by the assignment protocol: all prices and conversion modifiers above are **hypotheses**; none has been measured. Where an inference dragged, the inference tag is present.*
