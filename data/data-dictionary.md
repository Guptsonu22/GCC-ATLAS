# GCC Atlas — Data Dictionary

Scope: the SQLite dataset that powers the GCC Atlas prototype (`backend/data/gcc-atlas.db`), the curated array-of-record sources in `backend/src/data/seed-data.ts`, and the dashboard/statistics derived from them.

The dataset is a **curated, evidence-linked sample** — not a census of India's GCC ecosystem. Every record must be attributable to a source register entry.

---

## 1. Source records (`source_records`)

The provenance register backing every other table.

| Field | Type | Definition |
| --- | --- | --- |
| `id` | TEXT | Stable id, `src_<slug>`. |
| `title` | TEXT | Human-readable title. For news/report sources, states whether the URL is the exact article or a homepage provided instead of an unverified deep link. |
| `url` | TEXT | The cited URL. Must be `https`. **Never invented** — either an exact verified article/document link or the official publisher homepage, with the difference made explicit in `title`/`notes`. |
| `publisher` | TEXT | Issuing authority (government body), company, media house, or data firm. For policy records this doubles as the issuing authority. |
| `source_type` | TEXT | `news`, `government`, `company_announcement`, `report`, `job_board`, `provider_website`, `other`. |
| `publication_date` | TEXT | Publication/notified date when known; `null` when unknown — never guessed. |
| `last_verified_date` | TEXT | ISO date of the last manual verification pass. Absence/history: verified during Phase-1 research (2026-10) unless a source predates the pass and has not been rechecked. Drives the **stale-evidence** bucket (>365 days). |
| `verification_status` | TEXT | `verified` (fact-checked against the live URL), `unverified` (recorded as lead/homepage, not yet fact-checked), `stale` (needs re-verification), `conflicting` (facts differ across sources; must carry an explanatory `notes` and is flagged for manual review). |
| `confidence_level` | TEXT | `high` (official document / directly observed announcement), `medium` (official website but not the specific claim page), `low` (news homepages, crowd-sourced or third-party aggregators). |
| `notes` | TEXT | Verification trail: what was checked, what is uncertain, dual retained figures, etc. |

## 2. Sectors & locations (reference tables)

- `sectors` — industry taxonomy (`id`, `name`, `description`) used by companies. Sectors with zero companies remain listed (coverage visibility).
- `locations` — tracked Indian cities: `name` (city), `state`, `country` (always 'India'), `tier` (`tier1`/`tier2`/`tier3`/`emerging` per the Phase-1 market classification — a **classification of tracked markets, not an official census designation**), `population`, `gdp_per_capita_usd` (only when a verified figure existed; else `null`).

## 3. Companies (`companies`, `company_locations`, `company_sources`)

One row per tracked GCC entity (the India capability center of a multinational), never the global parent on its own.

| Field | Definition |
| --- | --- |
| `name` | Operating entity name (e.g., "SAP Labs India"). Identity registered against similarly named entities — merging two similarly named organizations requires manual identity checks (rule 4). |
| `parent_company` | Global parent, verbatim as published. |
| `sector_id` | Industry of the capability center. |
| `headquarters_*` | HQ of the parent organization (country/city), as stated by the company. |
| `india_entry_year` | Year the parent entered India, only where published; else `null`. |
| `operating_status` | `active`, `expanding`, `downsizing`, `closed`, `announced`. Status is only recorded when evidence supports it; **an announced centre is never presented as operational** (rule 2). |
| `employee_count_india` | Only when a verifiable figure exists (official statements/announcements); else `null`. Crowd-sourced numbers are not stored here. |
| `website` | Official company (or India) website — `https`. |
| `is_demo_data` | 1 only for demonstrative/illustrative fixtures (rule 8). Never shown as fact-bearing data. |

`company_locations`: the operating locations of the entity.

| Field | Definition |
| --- | --- |
| `office_type` | `development_center`, `captive`, `shared_services`, `innovation_lab`, `bpo` (GCC-bearing office types, rule 3) or `headquarters`/`other` (corporate, sales, GA offices — reported, but never counted as GCC evidence). |
| `established_year` | Year the centre became operational — only when published; **left `null` for announced/not-yet-operational centres** (rule 2). |
| `is_primary` | Largest/flagship delivery centre of this entity in India (editorial, based on published descriptions). |
| `source_id` | Source the location record comes from. |

`company_sources`: the evidence trail between a company and its source records (incl. `field_referenced`).

## 4. City metrics (`city_metrics`)

One row per (city, metric, period). Every metric row carries:

| Field | Definition |
| --- | --- |
| `metric_name` | Tracked key from the registry (`gcc_count_estimated`, `tech_talent_pool_estimated`, `office_rent_grade_a`, `metro_rail_km_operational`, `senior_engineer_total_comp`, `entry_engineer_total_comp`). |
| `metric_value` | The number as reported. |
| `metric_unit` | Must match the per-metric registry unit (rule 5 — no mixed compensation periods or rent units). |
| `metric_period` | Registry-locked per metric (rule 5). All cities share the period so cross-city comparison stays valid. |
| `metric_definition` | **Mandatory** counting basis: who counted what, and over which denominator (rule 10). |
| `source_id` | The report/article the figure is attributed to. |
| `is_estimate` | `true` for all currently tracked metrics — figures are indicative aggregations of public commentary, not official censuses. Rendered with an estimate badge in UI. |
| `confidence_level` | Confidence inherited from the cited source. |

## 5. Policy records (`policy_records`)

| Field | Definition |
| --- | --- |
| `state` | Issuing state (or `Central Government`). |
| `title` | Policy title as notified. |
| `policy_type` | Category: `incentive`, `regulation`, `infrastructure`, `talent`, `tax`, `land`, `other`. |
| `status` | `draft` (in consultation), `finalized` (notified/in force), `announced` (declared, operational detail pending), `superseded`/expired. |
| `issuing_authority` | Not a separate column — carried on the cited source's `publisher` (e.g., "Government of Uttar Pradesh (Invest UP)"). |
| `effective_date` / `expiry_date` | Notified effectiveness window when known. **An expired or superseded policy never joins the "currently applicable" set** (`is_active` = 0; rule 6). |
| `benefits` | Verbatim benefit strings from the policy document. |
| `normalized_benefits` | JSON array `{type, band_or_amount, eligibility_threshold, notes}` for comparative rendering. Bands are only normalized from verified documents (unverified frameworks ship with a deliberate `uncertain` row instead). |
| `eligibility_criteria` | Who qualifies (investment thresholds, jobs payable > Rs.1L/month, etc.) — verbatim/paraphrased-with-care from the document. |
| `is_active` | Currently applicable flag — mirrors `status` and `expiry_date`, enforced by the import validator. |

## 6. Announcements (`announcements`)

Chronological corporate/state events tied to companies, locations, or the market at large:

- `announcement_type`: `expansion`, `new_center`, `hiring`, `investment`, `partnership`, `policy`, `closure`, `other`.
- `is_verified`: fact-checked flag. An announcement only affects a company's status narrative when verified.
- `employee_count_mentioned` / `investment_amount_usd`: only figures stated in the announcement.

## 7. Service providers (`service_providers`, `provider_capabilities`, `provider_sources`)

GCC-enabling vendors. `founded_year` refers to the **global organization's founding** (e.g., JLL's 1783 lineage), noted to avoid India-specific misreading. Capabilities are normalized rows, each optionally tied to the source record that documents them. Providers are collected only when identity was verifiable via the official website (`is_verified`, `verification_notes`).

## 8. Tracked-counting definitions (dashboard)

All counts are **derived from these tables**, and the dashboard repeats them under "counting_note":

- **Tracked records** — every row present in the dataset. The dataset is a curated sample; the dashboard never sums to an "India total" (rule 7).
- **Verified records** (companies) — the company cites at least one `verification_status = verified` source whose `last_verified_date` is within the last 365 days.
- **Awaiting verification** — the record has sources, none of them verified yet.
- **Stale evidence** — the record is backed (only) by sources last verified more than 365 days ago. A separate source-level count (`data_freshness.stale_sources`) flags the source register itself.
- **Conflicting** — the record cites a `conflicting` source; always excluded from the other buckets and surfaced for manual review (rule 9).
- **Coverage by city / sector / state** — `COUNT(*)` groupings over `company_locations → companies → sectors` and `policy_records.state`, including zero-coverage reference rows.

Implementation reference: `backend/src/data/quality.ts` (validator), `backend/src/repositories/dashboard.ts` (buckets), `backend/src/db/seed.ts` (import pipeline).
