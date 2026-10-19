# GCC Atlas — API Contract (v0.1.0)

Base URL (dev): `http://localhost:4000/api` (frontend Vite dev proxies `/api` → 4000).
All responses are JSON. Timestamps are UTC strings (`YYYY-MM-DD …` or ISO).

## Conventions

- **Envelope**: single-resource routes return the object directly; list routes return `{data: [...], total, page, page_size, total_pages}` where noted; collection-only routes return `{data: [...]}` (sectors, policies).
- **Pagination params** (list routes with an envelope): `page` (int ≥1, default 1), `page_size` (int 1–100, default 20).
- **Error envelope** (every non-2xx):
  ```json
  { "error": { "code": "validation_error", "message": "…", "details": [ /* zod issues, optional */ ] } }
  ```
  Codes: `validation_error` (400), `not_found` (404), `internal_error` (500). Validation failures include a zod issue list under `details`.
- **Session key**: saved-record endpoints require header `X-Session-Key: <8–64 chars, [A-Za-z0-9_-]>`. Missing/invalid → 400. All reads AND writes are scoped to the key; cross-session access yields `not_found`. Strategy rationale: architecture.md §5 (anonymous sessions, no accounts in v1).
- **Table ↔ path mapping** (documented rename): DB `source_records` → `/source-records`; DB `policy_records` → `/policies`; DB `service_providers` → `/providers`.
- **Provenance fields**: rows expose their backing source (`source_id`, plus joined `source_title` / `source_url` / `source_verification_status` / `source_publisher` where noted). `confidence_level` ∈ `high|medium|low`; metric rows additionally expose `is_estimate` (0|1) and `metric_definition`.

## Endpoints

### Meta
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | 200 → `{status:'ok', service:'gcc-atlas-api', version:'0.1.0', mode:'demo'\|'llm', database:'ok', uptime_seconds, time}`; DB probe failure → 503 `{status:'degraded', database:'error', …}` |
| GET | `/dashboard/stats` | totals + `companies_by_city/sector/status` + `data_freshness{sources_verified_last_30_days, …_90_days, stale_sources, unverified_sources}` + `counting_note` |
| GET | `/sectors` | `{data:[{id,name,description}]}` |

### Source records (provenance register)
| Method | Path | Query/Body |
|---|---|---|
| GET | `/source-records` | `query`, `source_type` (`news\|government\|company_announcement\|report\|job_board\|provider_website\|other`), `verification_status` (`verified\|unverified\|stale\|conflicting`), `confidence_level` (`high\|medium\|low`), pagination |
| GET | `/source-records/:id` | 404 envelope if unknown |

Row: `{id, title, url, publisher, source_type, publication_date, last_verified_date, verification_status, confidence_level, notes, created_at, updated_at}`.

### Companies
| Method | Path | Query |
|---|---|---|
| GET | `/companies` | `query`, `sector_id`, `location_id`, `operating_status` (`active\|expanding\|downsizing\|closed\|announced`), `parent_company`, `page`, `page_size`, `sort_by` (`name\|employee_count_india\|india_entry_year\|created_at`), `sort_order` |
| GET | `/companies/:id` | detail includes `locations[]` (with location names), `sources[]`, `announcements[]` |

### Cities & comparison
| Method | Path | Query |
|---|---|---|
| GET | `/cities` | — (list with `tracked_company_count`) |
| GET | `/cities/compare` | `ids` = comma-separated **2–4** location ids, e.g. `ids=loc_bengaluru,loc_hyderabad` → `{data:[{…location, metrics:[…]}]}` |
| GET | `/cities/:id` | detail includes `metrics[]` (with estimate flags/definitions/source joins) and `policies[]` (with `status`, `source_*` joins) |

### Policy records
| Method | Path | Query |
|---|---|---|
| GET | `/policies` | `state`, `status` (`draft\|finalized\|announced\|superseded`), `policy_type`, `active_only=true\|false` |
| GET | `/policies/:id` | detail with source joins |

Row highlights: `status` (never fake-active), `normalized_benefits` = JSON array `{type, band_or_amount, eligibility_threshold|null, notes}` for the comparison matrix; `unverified` bands are labelled rather than normalized. `benefits` (JSON string array) remains the human-readable list.

### Providers (service providers)
| Method | Path | Query |
|---|---|---|
| GET | `/providers` | `query`, `category` (`legal\|tax\|recruitment\|payroll\|eor\|real_estate\|consulting\|immigration\|other`), `location_id`, `is_verified=true\|false`, pagination |
| GET | `/providers/:id` | detail |

`capability_list` is a normalized array (react from `provider_capabilities`):
`[{ capability, source_id, source_url }]` — per-item provenance. `is_verified: 0|1`.

### Announcements
| Method | Path | Query |
|---|---|---|
| GET | `/announcements` | `company_id`, `location_id`, `announcement_type` (`expansion\|new_center\|hiring\|investment\|partnership\|policy\|closure\|other`), `days` (1–3650), pagination |

### Assistant (deterministic, cited)
| Method | Path | Notes |
|---|---|---|
| GET | `/assistant/status` | `{ai_configured, mode:'deterministic-demo'\|'llm', description}` |
| POST | `/assistant/query` | Body `{query: string (3–1000 chars), use_demo_mode?: boolean}`. Response `{answer, citations:[{source_id,title,url,publication_date,relevant_excerpt}] (≤8), confidence, is_demo_mode, insufficient_evidence}`. Short query → 400; assistant mode derives from `AI_API_KEY`. |

### Saved research (session-scoped)
| Method | Path | Notes |
|---|---|---|
| GET | `/saved-research` | header `X-Session-Key`; `{data:[…]}` |
| POST | `/saved-research` | `{name, type: 'city_comparison'\|'company_comparison'\|'provider_comparison'\|'custom_query', data: JSON}` → 201 |
| GET | `/saved-research/:id` | other sessions → 404 |
| PATCH | `/saved-research/:id` | `{name?, data?}` |
| DELETE | `/saved-research/:id` | 204 |

### Saved comparisons (NEW, session-scoped)
| Method | Path | Notes |
|---|---|---|
| GET | `/saved-comparisons` | `{data:[…]}` for the session key |
| POST | `/saved-comparisons` | `{name, location_ids: 2–4 DISTINCT ids, metric_names?: string[], notes?: string}` → 201; drafted `type` is always `city_comparison` in v1 |
| GET | `/saved-comparisons/:id` | 404 cross-session |
| DELETE | `/saved-comparisons/:id` | 204 |

Row: `{id, session_key, user_id:null, name, type, location_ids (JSON string), metric_names (JSON string|null), notes, created_at, updated_at}`.

## Worked examples

```bash
# Health
curl -s http://localhost:4000/api/health

# Finalized-state policies only
curl -s "http://localhost:4000/api/policies?status=finalized"

# High-confidence source register
curl -s "http://localhost:4000/api/source-records?confidence_level=high&page_size=2"

# Compare 3 hubs
curl -s "http://localhost:4000/api/cities/compare?ids=loc_bengaluru,loc_hyderabad,loc_mumbai"

# Create a saved comparison (400 if no session key)
curl -s -X POST http://localhost:4000/api/saved-comparisons \
  -H "Content-Type: application/json" \
  -H "X-Session-Key: my-session-abc123" \
  -d '{"name":"Hub shortlist","location_ids":["loc_bengaluru","loc_mumbai"]}'

# Assistant
curl -s -X POST http://localhost:4000/api/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"query":"Compare Bengaluru and Hyderabad office costs"}'
```
