# GCC Atlas — Collection Methodology

How the dataset was collected, verified, and imported. Companion to `data/data-dictionary.md`.

## 1. Objectives and honesty rules

The dataset exists to power a credible, useful **prototype** — not the largest possible database. Scale was traded for verifiability at every decision. The ten rules enforced mechanically (and checked by tests) are:

1. **Never invent a source URL.** Either an exact verified article/document link, or the publisher's official homepage *explicitly labeled* as a homepage in `title`/`notes`.
2. **An announced centre is never operational.** `new_center` announcements without verification cannot coexist with an `established_year`; record `operating_status` only where evidence exists.
3. **A general office is not a confirmed GCC.** Company records must carry at least one GCC-type office (development_center / captive / innovation_lab / shared_services / bpo); sales-type offices (`other`) are retained as context only.
4. **Never merge similarly named companies without identity checks.** Names are normalized (legal suffixes, brackets, punctuation stripped); collisions abort import and must be consciously registered after manual review.
5. **No mixed compensation periods or rent units.** Each metric name has a registry-locked unit and period — all cities share them, making cross-city comparison meaningful.
6. **Expired policies are not applicable.** `superseded`/past-expiry policies are forced out of the active set (`is_active=0`, validator-enforced).
7. **No ecosystem totals from an incomplete sample.** The dashboard counts tracked records only, with a permanent counting disclosure.
8. **Demonstrative records are labeled.** Placeholder sources (e.g., `example.com`) may exist in the register for demonstrating staleness/conflict handling, but nothing real may cite them.
9. **Conflicting facts are flagged for manual review.** `verification_status='conflicting'` requires an explanatory `notes` entry; dual figures are *retained both* (e.g., Kerala's draft 120-target vs Outlook 2026 150-target) and never blended.
10. **Methodology is visible to the user.** Source register (Sources page), counting notes (Dashboard), metric definitions on every city metric (tooltips), and this document.

## 2. Collection process

**Sources of truth (in order of preference):**
1. Official government notices (policy PDFs from dept. portals, Press Information Bureau releases).
2. Company official websites and newsrooms (announcements of centres, India entry).
3. Industry-body research (NASSCOM, Zinnov) for market-wide figures — always cited as indicative estimates.
4. Reputable business press (Economic Times, BusinessLine) — mostly homepage-level leads pending deep verification.
5. Crowd-sourced compensation (AmbitionBox) — low confidence, explicitly average midpoints, labeled estimate.

**Per-record requirements:** title, URL, publisher, publication date (when known), last-verified date, verification status, confidence level.

**City metrics:** collected only where a figure was found in public market commentary; each row carries the exact counting basis ("aggregated from public market commentary, not an official census", "indicative midpoint of commonly reported Grade-A asking rents", etc.). No metric is stored without a source record.

**Policies:** collected for Karnataka, Tamil Nadu, Kerala, Uttar Pradesh, Gujarat (verified documents), plus the central National Framework (PIB) and two flagged unverified placeholders (Maharashtra, Telangana) that stay in the register with low confidence and unverified status until re-verified on official portals.

**Service providers:** an intentionally small directory (16 profiles) of GCC-relevant enablers, verified identically (official website, capability rows, source links).

## 3. Verification workflow

- **Initial pass (Phase 1 research):** each candidate record was checked against the live URL; the findings live in `research/source-register.csv` and `research/verify.md`.
- **Re-verification pass (this phase):** every cited source received an explicit `last_verified_date`. Sources older than 365 days enter the stale-evidence bucket automatically (`isStale()`; today: several news/wikipedia/homepage sources).
- **Conflicts:** when two credible sources disagree (e.g., the two Kerala target variants), both facts are kept with their dates and denominators, the source is flagged `conflicting`, and the summary text states which figures belong to which edition.
- **Reviewer interface:** the Sources page is the evidence explorer — every source shows its confidence, verification status, staleness, and (new) the full list of records citing it (`GET /api/source-records/:id` → `usage`).

## 4. Import pipeline

`backend/src/db/seed.ts` (`npm run seed`):

1. **Validate first** (`backend/src/data/quality.ts::validateSeedDataset`): the full dataset must pass URL/format, reference-integrity, uniqueness, identity-collision, metric-registry, policy-applicability, demonstrative-label and conflict-note checks before a single row is written. Any error aborts the import with a precise row-level report (`npm run seed -- --check` runs validation alone).
2. **Upsert by stable id** (`INSERT ... ON CONFLICT DO UPDATE`): reruns refresh curated content and never duplicate rows (junction tables use `INSERT OR IGNORE` on their natural unique keys). User-owned tables (`saved_research`, `saved_comparisons`) are untouched.
3. **Report**: imported row counts per table + quality warnings (currently: 10 stale sources awaiting re-verification) printed for reviewers.
4. `--reset` re-builds from scratch (used by tests and after schema changes).

Deterministic ids are curated by hand in `seed-data.ts` (`com_*`, `src_*`, `loc_*`, `met_<city>_<metric>`, `pol_*`, `ann_*`, `prv_*`) — these are the stable identifiers guaranteed against duplication and safe to reference in comparisons.

## 5. What this dataset deliberately does not contain

- Any claim to a total count of GCCs in India (industry totals exist — ~1,700 FY2024 / 2,117 FY2026 — but are cited as industry estimates only).
- Employee counts without a published statement, except where noted.
- Rent/salary figures as more than indicative midpoints (all such rows ship `is_estimate=true` with contractually uniform units).
- Any AI-generated research claim — the Assistant runs in a deterministic demo mode over this dataset until sources support more.
- Fabricated URLs; unknown publication dates are `null`, never guessed.

## 6. Known data limitations (disclosed)

| Limitation | Handling |
| --- | --- |
| News/report sources cited as homepages awaiting article-level verification | `verification_status='unverified'`, low confidence, notes say so; appear in stale/awaiting buckets |
| City metric values are commentary-derived estimates | `is_estimate=true` + estimate badge in UI + metric_definition text |
| Two Maharashtra/Telangana policy leads unverified | low confidence, `is_active` constraints, "verify on official portal" notes |
| Wikipedia-sourced infrastructure lengths | low/medium confidence, staleness bucket, "verify against authority" notes |
| Coverage skews to tier-1 GCC hubs | dashboard shows coverage by city/sector so gaps remain visible |
