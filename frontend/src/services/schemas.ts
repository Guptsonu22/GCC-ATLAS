import { z } from 'zod';

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  publisher: z.string().nullable().optional(),
  source_type: z.string(),
  publication_date: z.string().nullable().optional(),
  last_verified_date: z.string(),
  verification_status: z.enum(['verified', 'unverified', 'stale', 'conflicting']),
  confidence_level: z.enum(['high', 'medium', 'low']),
  notes: z.string().nullable().optional(),
});

const companyLocationSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  location_id: z.string(),
  office_type: z.string(),
  employee_count: z.number().nullable(),
  established_year: z.number().nullable().optional(),
  is_primary: z.number(),
  source_id: z.string().nullable().optional(),
  location_name: z.string().optional(),
  location_state: z.string().optional(),
});

export const sectorSchema = z.object({ id: z.string(), name: z.string(), description: z.string().nullable().optional() });

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  parent_company: z.string().nullable(),
  sector_id: z.string().nullable(),
  headquarters_country: z.string().nullable().optional(),
  headquarters_city: z.string().nullable().optional(),
  india_entry_year: z.number().nullable(),
  operating_status: z.enum(['active', 'expanding', 'downsizing', 'closed', 'announced']),
  employee_count_india: z.number().nullable(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  is_demo_data: z.number(),
  sector_name: z.string().nullable().optional(),
  sector: sectorSchema.optional(),
  locations: z.array(companyLocationSchema).optional(),
  sources: z.array(sourceSchema).optional(),
  announcements: z.array(z.record(z.string(), z.unknown())).optional(),
  created_at: z.string(),
});

export type Source = z.infer<typeof sourceSchema>;
export type Sector = z.infer<typeof sectorSchema>;
export type CompanyLocation = z.infer<typeof companyLocationSchema>;
export type Company = z.infer<typeof companySchema>;

export const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
  });

export const companiesResponseSchema = paginatedSchema(companySchema);

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string(),
  tier: z.string().nullable().optional(),
  tracked_company_count: z.number().optional(),
});

export const cityMetricSchema = z.object({
  id: z.string().optional(),
  location_id: z.string().optional(),
  metric_name: z.string(),
  metric_value: z.number().nullable(),
  metric_unit: z.string().nullable().optional(),
  metric_period: z.string().nullable().optional(),
  metric_definition: z.string().nullable().optional(),
  source_id: z.string().nullable().optional(),
  is_estimate: z.number(),
  confidence_level: z.enum(['high', 'medium', 'low']),
  city_name: z.string().optional(),
  source_title: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  source_verification_status: z.string().nullable().optional(),
});

export const policyRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  state: z.string(),
  policy_type: z.string(),
  status: z.enum(['draft', 'finalized', 'announced', 'superseded']),
  description: z.string().nullable().optional(),
  benefits: z.string().nullable().optional(),
  normalized_benefits: z.string().nullable().optional(),
  eligibility_criteria: z.string().nullable().optional(),
  effective_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  is_active: z.number(),
  source_title: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  source_publisher: z.string().nullable().optional(),
});

export type PolicyRecord = z.infer<typeof policyRecordSchema>;

export const cityDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.string(),
  tier: z.string().nullable().optional(),
  tracked_company_count: z.number().optional(),
  metrics: z.array(cityMetricSchema).optional(),
  policies: z.array(policyRecordSchema).optional(),
});

export const capabilitySchema = z.object({
  capability: z.string(),
  source_id: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
});

export const providerSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  subcategory: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  headquarters_location_id: z.string().nullable().optional(),
  case_studies: z.string().nullable().optional(),
  founded_year: z.number().nullable().optional(),
  is_verified: z.number(),
  verification_notes: z.string().nullable().optional(),
  operating_location_objects: z.array(locationSchema).optional(),
  capability_list: z.array(z.union([z.string(), capabilitySchema])).optional(),
  case_study_list: z.array(z.record(z.string(), z.unknown())).optional(),
  headquarters_location: locationSchema.optional(),
  sources: z.array(sourceSchema).optional(),
});

export const providersResponseSchema = paginatedSchema(providerSchema);

export type CityMetric = z.infer<typeof cityMetricSchema>;
export type CityDetail = z.infer<typeof cityDetailSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type Announcement = z.infer<typeof announcementSchema>;
export type AIQueryResponse = z.infer<typeof aiQueryResponseSchema>;
export type AssistantStatus = z.infer<typeof assistantStatusSchema>;
export type SavedResearch = z.infer<typeof savedResearchSchema>;
export type SavedComparison = z.infer<typeof savedComparisonSchema>;

export const dashboardStatsSchema = z.object({
  total_companies: z.number(),
  total_locations: z.number(),
  total_sectors: z.number(),
  total_providers: z.number(),
  total_sources: z.number(),
  recent_announcements: z.number(),
  companies_by_city: z.array(z.object({ city: z.string(), count: z.number() })),
  companies_by_sector: z.array(z.object({ sector: z.string(), count: z.number() })),
  companies_by_status: z.array(z.object({ status: z.string(), count: z.number() })),
  data_freshness: z.object({
    sources_verified_last_30_days: z.number(),
    sources_verified_last_90_days: z.number(),
    stale_sources: z.number(),
    unverified_sources: z.number().optional(),
  }),
  counting_note: z.string(),
});

export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().nullable().optional(),
  announcement_type: z.string(),
  announcement_date: z.string(),
  company_name: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  source_title: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  source_verification_status: z.string().nullable().optional(),
  is_verified: z.number(),
});

export const aiQueryResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      source_id: z.string(),
      title: z.string(),
      url: z.string(),
      publication_date: z.string().nullable(),
      relevant_excerpt: z.string(),
    }),
  ),
  confidence: z.enum(['high', 'medium', 'low']),
  is_demo_mode: z.boolean(),
  insufficient_evidence: z.boolean(),
});

export const assistantStatusSchema = z.object({
  ai_configured: z.boolean(),
  mode: z.string(),
  description: z.string(),
});

export const savedResearchSchema = z.object({
  id: z.string(),
  session_key: z.string(),
  user_id: z.string().nullable().optional(),
  name: z.string(),
  type: z.enum(['city_comparison', 'company_comparison', 'provider_comparison', 'custom_query']),
  data: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const savedComparisonSchema = z.object({
  id: z.string(),
  session_key: z.string(),
  user_id: z.string().nullable().optional(),
  name: z.string(),
  type: z.enum(['city_comparison', 'company_comparison']),
  location_ids: z.string(),
  metric_names: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
