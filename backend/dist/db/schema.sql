-- GCC Atlas Database Schema
-- Normalized schema for companies, locations, sectors, sources, providers, city metrics, policies, announcements, saved research

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Sectors table
CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Locations (cities) table
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

-- Source records table (provenance for all data)
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source_type TEXT CHECK(source_type IN ('news', 'government', 'company_announcement', 'report', 'job_board', 'provider_website', 'other')),
  publication_date TEXT,
  last_verified_date TEXT NOT NULL DEFAULT (datetime('now')),
  verification_status TEXT CHECK(verification_status IN ('verified', 'unverified', 'stale', 'conflicting')) DEFAULT 'unverified',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Companies (GCCs) table
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

-- Company locations (many-to-many)
CREATE TABLE IF NOT EXISTS company_locations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  office_type TEXT CHECK(office_type IN ('headquarters', 'development_center', 'bpo', 'captive', 'shared_services', 'innovation_lab', 'other')),
  employee_count INTEGER,
  established_year INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  source_id TEXT REFERENCES sources(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(company_id, location_id)
);

-- Company sources (evidence trail)
CREATE TABLE IF NOT EXISTS company_sources (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  field_referenced TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(company_id, source_id, field_referenced)
);

-- City metrics table
CREATE TABLE IF NOT EXISTS city_metrics (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  metric_unit TEXT,
  metric_period TEXT,
  metric_definition TEXT,
  source_id TEXT REFERENCES sources(id),
  is_estimate INTEGER NOT NULL DEFAULT 0,
  confidence_level TEXT CHECK(confidence_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(location_id, metric_name, metric_period)
);

-- Service providers table
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK(category IN ('legal', 'tax', 'recruitment', 'payroll', 'eor', 'real_estate', 'consulting', 'immigration', 'other')) NOT NULL,
  subcategory TEXT,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  headquarters_location_id TEXT REFERENCES locations(id),
  operating_locations TEXT, -- JSON array of location IDs
  capabilities TEXT, -- JSON array of capability strings
  case_studies TEXT, -- JSON array of case study objects
  founded_year INTEGER,
  employee_count INTEGER,
  is_verified INTEGER NOT NULL DEFAULT 0,
  verification_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Provider sources
CREATE TABLE IF NOT EXISTS provider_sources (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(provider_id, source_id)
);

-- Policy records table
CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  policy_type TEXT CHECK(policy_type IN ('incentive', 'regulation', 'infrastructure', 'talent', 'tax', 'land', 'other')) NOT NULL,
  description TEXT,
  benefits TEXT, -- JSON array
  eligibility_criteria TEXT,
  effective_date TEXT,
  expiry_date TEXT,
  source_id TEXT REFERENCES sources(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Announcements / news table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  announcement_type TEXT CHECK(announcement_type IN ('expansion', 'new_center', 'hiring', 'investment', 'partnership', 'policy', 'closure', 'other')) NOT NULL,
  announcement_date TEXT NOT NULL,
  source_id TEXT REFERENCES sources(id),
  employee_count_mentioned INTEGER,
  investment_amount_usd REAL,
  is_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Saved comparisons / research items
CREATE TABLE IF NOT EXISTS saved_research (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('city_comparison', 'company_comparison', 'provider_comparison', 'custom_query')) NOT NULL,
  data TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(operating_status);
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON company_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_locations_location ON company_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_city_metrics_location ON city_metrics(location_id);
CREATE INDEX IF NOT EXISTS idx_city_metrics_name ON city_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);
CREATE INDEX IF NOT EXISTS idx_announcements_company ON announcements(company_id);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON announcements(announcement_date);
CREATE INDEX IF NOT EXISTS idx_saved_research_user ON saved_research(user_id);