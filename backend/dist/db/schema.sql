-- GCC Atlas Database Schema
-- ----------------------------------------------------------------------------
-- Entity model (normalized; every user-facing fact carries provenance):
--   sectors / locations            reference data
--   source_records                 provenance register (publisher, verification dates, confidence)
--   companies + company_locations  GCC organizations and their delivery locations
--   company_sources                evidence trail between companies and sources
--   city_metrics                   per-location metrics w/ metric_definition (counting basis)
--   policy_records                 state/national GCC policies incl. draft/final status
--   announcements                  verified expansion/policy/news events
--   service_providers + provider_capabilities + provider_sources  enabler directory
--   saved_research                 user (or anonymous-session) saved notes/queries
--   saved_comparisons              user (or anonymous-session) saved city comparisons
--
-- Ownership strategy for saved_* tables: records are scoped by session_key
-- (anonymous, client-generated, validated header) — records are never exposed
-- across sessions. user_id exists for a future authenticated model.
-- ----------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- sectors
CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- locations
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  tier TEXT CHECK(tier IN ('tier1', 'tier2', 'tier3', 'emerging')),
  population INTEGER,
  gdp_per_capita_usd REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- source_records
CREATE TABLE IF NOT EXISTS source_records (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  publisher TEXT,
  source_type TEXT CHECK(source_type IN ('news', 'government', 'company_announcement', 'report', 'job_board', 'provider_website', 'other')),
  publication_date TEXT,
  last_verified_date TEXT NOT NULL DEFAULT (datetime('now')),
  verification_status TEXT CHECK(verification_status IN ('verified', 'unverified', 'stale', 'conflicting')) DEFAULT 'unverified',
  confidence_level TEXT CHECK(confidence_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- companies
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_company TEXT,
  sector_id TEXT REFERENCES sectors(id),
  headquarters_country TEXT,
  headquarters_city TEXT,
  india_entry_year INTEGER,
  operating_status TEXT CHECK(operating_status IN ('active', 'expanding', 'downsizing', 'closed', 'announced')) DEFAULT 'active',
  employee_count_india INTEGER,
  employee_count_global INTEGER,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  is_demo_data INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS company_locations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  office_type TEXT CHECK(office_type IN ('headquarters', 'development_center', 'bpo', 'captive', 'shared_services', 'innovation_lab', 'other')),
  employee_count INTEGER,
  established_year INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  source_id TEXT REFERENCES source_records(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(company_id, location_id)
);

CREATE TABLE IF NOT EXISTS company_sources (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES source_records(id) ON DELETE CASCADE,
  field_referenced TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(company_id, source_id, field_referenced)
);

-- ---------------------------------------------------------------- city_metrics
CREATE TABLE IF NOT EXISTS city_metrics (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  metric_unit TEXT,
  metric_period TEXT,
  metric_definition TEXT,          -- counting basis / methodology note (mandatory in practice)
  source_id TEXT REFERENCES source_records(id),
  is_estimate INTEGER NOT NULL DEFAULT 0,
  confidence_level TEXT CHECK(confidence_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(location_id, metric_name, metric_period)
);

-- ---------------------------------------------------------------- policy_records
CREATE TABLE IF NOT EXISTS policy_records (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  policy_type TEXT CHECK(policy_type IN ('incentive', 'regulation', 'infrastructure', 'talent', 'tax', 'land', 'other')) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'finalized', 'announced', 'superseded')),
  description TEXT,
  benefits TEXT,                   -- JSON array of raw quoted benefit strings
  normalized_benefits TEXT,        -- JSON array of {type, band_or_amount, eligibility_threshold, notes} for comparison rendering
  eligibility_criteria TEXT,
  effective_date TEXT,
  expiry_date TEXT,
  source_id TEXT REFERENCES source_records(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- announcements
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  announcement_type TEXT CHECK(announcement_type IN ('expansion', 'new_center', 'hiring', 'investment', 'partnership', 'policy', 'closure', 'other')) NOT NULL,
  announcement_date TEXT NOT NULL,
  source_id TEXT REFERENCES source_records(id),
  employee_count_mentioned INTEGER,
  investment_amount_usd REAL,
  is_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- service_providers
CREATE TABLE IF NOT EXISTS service_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK(category IN ('legal', 'tax', 'recruitment', 'payroll', 'eor', 'real_estate', 'consulting', 'immigration', 'other')) NOT NULL,
  subcategory TEXT,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  headquarters_location_id TEXT REFERENCES locations(id),
  operating_locations TEXT,        -- JSON array of location IDs
  case_studies TEXT,               -- JSON array of case study objects
  founded_year INTEGER,
  employee_count INTEGER,
  is_verified INTEGER NOT NULL DEFAULT 0,
  verification_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Normalized capabilities (replaces JSON column)
CREATE TABLE IF NOT EXISTS provider_capabilities (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  source_id TEXT REFERENCES source_records(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider_id, capability)
);

CREATE TABLE IF NOT EXISTS provider_sources (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES source_records(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider_id, source_id)
);

-- ---------------------------------------------------------------- saved_research
CREATE TABLE IF NOT EXISTS saved_research (
  id TEXT PRIMARY KEY,
  session_key TEXT NOT NULL,       -- anonymous-session scope (validated header)
  user_id TEXT,                    -- optional future authenticated owner
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('city_comparison', 'company_comparison', 'provider_comparison', 'custom_query')) NOT NULL,
  data TEXT NOT NULL,              -- JSON payload
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- saved_comparisons
-- Dedicated table for persisted city comparisons (Phase-2 MVP core loop).
CREATE TABLE IF NOT EXISTS saved_comparisons (
  id TEXT PRIMARY KEY,
  session_key TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'city_comparison' CHECK(type IN ('city_comparison', 'company_comparison')),
  location_ids TEXT NOT NULL,      -- JSON array of location ids (2..4)
  metric_names TEXT,               -- optional JSON array of metric filter
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- events
-- Append-only usage instrumentation (PRD §3.5). No user-identifying data is
-- stored: the session key POSTed with events is hashed to a pseudonymous id
-- for repeat-visit counting and never stored raw.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,              -- catalog: search, detail_view, compare_create, compare_reopen, source_click, export, saved_create
  session_hash TEXT,               -- sha256 hash of session key, truncated (pseudonymous, non-reversible)
  properties TEXT,                 -- small JSON bag (category of object engaged with; page path)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------- indexes
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(operating_status);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON company_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_locations_location ON company_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_city_metrics_location ON city_metrics(location_id);
CREATE INDEX IF NOT EXISTS idx_city_metrics_name ON city_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_source_records_type ON source_records(source_type);
CREATE INDEX IF NOT EXISTS idx_source_records_status ON source_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_policy_records_state ON policy_records(state);
CREATE INDEX IF NOT EXISTS idx_policy_records_status ON policy_records(status);
CREATE INDEX IF NOT EXISTS idx_announcements_company ON announcements(company_id);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(announcement_date);
CREATE INDEX IF NOT EXISTS idx_announcements_location ON announcements(location_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_category ON service_providers(category);
CREATE INDEX IF NOT EXISTS idx_provider_capabilities_provider ON provider_capabilities(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_sources_provider ON provider_sources(provider_id);
CREATE INDEX IF NOT EXISTS idx_saved_research_session ON saved_research(session_key);
CREATE INDEX IF NOT EXISTS idx_saved_comparisons_session ON saved_comparisons(session_key);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
