export interface Sector {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  state: string;
  country: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'emerging';
  population: number | null;
  gdp_per_capita_usd: number | null;
  created_at: string;
  updated_at: string;
}

export interface SourceRecord {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  source_type: 'news' | 'government' | 'company_announcement' | 'report' | 'job_board' | 'provider_website' | 'other';
  publication_date: string | null;
  last_verified_date: string;
  verification_status: 'verified' | 'unverified' | 'stale' | 'conflicting';
  confidence_level: 'high' | 'medium' | 'low';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Back-compatible alias (table renamed to `source_records` in Phase 3). */
export type Source = SourceRecord;

export interface Company {
  id: string;
  name: string;
  parent_company: string | null;
  sector_id: string | null;
  headquarters_country: string | null;
  headquarters_city: string | null;
  india_entry_year: number | null;
  operating_status: 'active' | 'expanding' | 'downsizing' | 'closed' | 'announced';
  employee_count_india: number | null;
  employee_count_global: number | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  is_demo_data: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithRelations extends Company {
  sector?: Sector;
  locations?: CompanyLocation[];
  sources?: Source[];
}

export interface CompanyLocation {
  id: string;
  company_id: string;
  location_id: string;
  office_type: 'headquarters' | 'development_center' | 'bpo' | 'captive' | 'shared_services' | 'innovation_lab' | 'other';
  employee_count: number | null;
  established_year: number | null;
  is_primary: number;
  source_id: string | null;
  created_at: string;
  updated_at: string;
  location?: Location;
  source?: Source;
}

export interface CompanySource {
  id: string;
  company_id: string;
  source_id: string;
  field_referenced: string | null;
  created_at: string;
  source?: Source;
}

export interface CityMetric {
  id: string;
  location_id: string;
  metric_name: string;
  metric_value: number | null;
  metric_unit: string | null;
  metric_period: string | null;
  metric_definition: string | null;
  source_id: string | null;
  is_estimate: number;
  confidence_level: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
  location?: Location;
  source?: Source;
}

export interface Provider {
  id: string;
  name: string;
  category: 'legal' | 'tax' | 'recruitment' | 'payroll' | 'eor' | 'real_estate' | 'consulting' | 'immigration' | 'other';
  subcategory: string | null;
  description: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  headquarters_location_id: string | null;
  operating_locations: string | null; // JSON array
  case_studies: string | null; // JSON array
  founded_year: number | null;
  employee_count: number | null;
  is_verified: number;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Back-compatible alias (table renamed to `service_providers` in Phase 3). */
export type ServiceProvider = Provider;

export interface ProviderWithRelations extends Provider {
  headquarters_location?: Location;
  operating_location_objects?: Location[];
  capability_list?: Capability[];
  case_study_list?: CaseStudy[];
  sources?: Source[];
}

export interface Capability {
  capability: string;
  source_id: string | null;
  source_url?: string | null;
}

export interface CaseStudy {
  title: string;
  description: string;
  client_type: string;
  outcome: string;
  source_url?: string;
}

export interface ProviderSource {
  id: string;
  provider_id: string;
  source_id: string;
  created_at: string;
  source?: Source;
}

export interface PolicyRecord {
  id: string;
  title: string;
  state: string;
  policy_type: 'incentive' | 'regulation' | 'infrastructure' | 'talent' | 'tax' | 'land' | 'other';
  status: 'draft' | 'finalized' | 'announced' | 'superseded';
  description: string | null;
  benefits: string | null; // JSON array
  normalized_benefits: string | null; // JSON array of {type, band_or_amount, eligibility_threshold, notes}
  eligibility_criteria: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  source_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  source?: SourceRecord;
}

/** Back-compatible alias (table renamed to `policy_records` in Phase 3). */
export type Policy = PolicyRecord;

export interface Announcement {
  id: string;
  company_id: string | null;
  location_id: string | null;
  title: string;
  summary: string | null;
  content: string | null;
  announcement_type: 'expansion' | 'new_center' | 'hiring' | 'investment' | 'partnership' | 'policy' | 'closure' | 'other';
  announcement_date: string;
  source_id: string | null;
  employee_count_mentioned: number | null;
  investment_amount_usd: number | null;
  is_verified: number;
  created_at: string;
  updated_at: string;
  company?: Company;
  location?: Location;
  source?: Source;
}

export interface SavedResearch {
  id: string;
  /** Omitted from API responses (server strips it); present in DB rows. */
  session_key?: string;
  user_id: string | null;
  name: string;
  type: 'city_comparison' | 'company_comparison' | 'provider_comparison' | 'custom_query';
  data: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface SavedComparison {
  id: string;
  /** Omitted from API responses (server strips it); present in DB rows. */
  session_key?: string;
  user_id: string | null;
  name: string;
  type: 'city_comparison' | 'company_comparison';
  location_ids: string; // JSON array
  metric_names: string | null; // optional JSON array
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedComparisonInput {
  name: string;
  location_ids: string[];
  metric_names?: string[];
  notes?: string;
}

// API request/response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CompanyFilters {
  query?: string;
  sector_id?: string;
  location_id?: string;
  operating_status?: Company['operating_status'];
  parent_company?: string;
  is_demo_data?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: 'name' | 'employee_count_india' | 'india_entry_year' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface ProviderFilters {
  category?: Provider['category'];
  location_id?: string;
  capability?: string;
  query?: string;
  is_verified?: boolean;
  page?: number;
  page_size?: number;
}

export interface CityComparisonFilters {
  location_ids: string[];
  metric_names?: string[];
}

export interface AIQueryRequest {
  query: string;
  context?: Record<string, unknown>;
  use_demo_mode?: boolean;
}

export interface AssistantComparisonTable {
  caption: string;
  columns: string[];
  rows: { label: string; values: (string | null)[] }[];
}

export interface AssistantAnswer {
  direct_answer: string;
  key_findings: string[];
  comparison_table: AssistantComparisonTable | null;
  evidence_facts: { statement: string; source_ids: string[] }[];
  recommendations: { text: string; basis: string }[];
  assumptions: string[];
  missing_information: string[];
  next_step: string | null;
}

export interface AssistantRetrievalMeta {
  matched: Record<string, number>;
  records_included: number;
  evidence_sources: number;
  time_window_days: number | null;
}

export interface AIQueryResponse {
  mode: 'llm' | 'demo';
  is_demo_mode: boolean;
  confidence: 'high' | 'medium' | 'low';
  insufficient_evidence: boolean;
  answer: AssistantAnswer;
  citations: Citation[];
  retrieval: AssistantRetrievalMeta;
}

export interface Citation {
  source_id: string;
  title: string;
  url: string;
  publication_date: string | null;
  relevant_excerpt: string;
  verification_status: string | null;
}

export interface DashboardStats {
  total_companies: number;
  total_locations: number;
  total_sectors: number;
  total_providers: number;
  total_sources: number;
  recent_announcements: number;
  companies_by_city: { city: string; count: number }[];
  companies_by_sector: { sector: string; count: number }[];
  companies_by_status: { status: string; count: number }[];
  data_freshness: {
    sources_verified_last_30_days: number;
    sources_verified_last_90_days: number;
    stale_sources: number;
  };
}