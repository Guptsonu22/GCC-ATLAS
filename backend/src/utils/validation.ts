import { z } from 'zod';

export const companyFiltersSchema = z.object({
  query: z.string().trim().max(200).optional(),
  sector_id: z.string().trim().max(60).optional(),
  location_id: z.string().trim().max(60).optional(),
  operating_status: z.enum(['active', 'expanding', 'downsizing', 'closed', 'announced']).optional(),
  parent_company: z.string().trim().max(200).optional(),
  is_demo_data: z.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
  sort_by: z.enum(['name', 'employee_count_india', 'india_entry_year', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const providerFiltersSchema = z.object({
  query: z.string().trim().max(200).optional(),
  category: z.enum(['legal', 'tax', 'recruitment', 'payroll', 'eor', 'real_estate', 'consulting', 'immigration', 'other']).optional(),
  location_id: z.string().trim().max(60).optional(),
  is_verified: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
});

export const sourceFiltersSchema = z.object({
  query: z.string().trim().max(200).optional(),
  source_type: z.enum(['news', 'government', 'company_announcement', 'report', 'job_board', 'provider_website', 'other']).optional(),
  verification_status: z.enum(['verified', 'unverified', 'stale', 'conflicting']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
});

export const announcementFiltersSchema = z.object({
  company_id: z.string().trim().max(60).optional(),
  location_id: z.string().trim().max(60).optional(),
  announcement_type: z.enum(['expansion', 'new_center', 'hiring', 'investment', 'partnership', 'policy', 'closure', 'other']).optional(),
  days: z.coerce.number().int().min(1).max(3650).optional(),
  page: z.coerce.number().int().min(1).optional(),
  page_size: z.coerce.number().int().min(1).max(100).optional(),
});

export const compareSchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4)),
});

export const assistantSchema = z.object({
  query: z.string().trim().min(3).max(1000),
  use_demo_mode: z.boolean().optional(),
});

export const savedResearchCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(['city_comparison', 'company_comparison', 'provider_comparison', 'custom_query']),
  data: z.unknown(),
});

export const savedResearchUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  data: z.unknown().optional(),
});

export function parseOr400<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const err = new Error('Validation failed') as Error & { status?: number; details?: unknown };
    err.status = 400;
    err.details = result.error.issues;
    throw err;
  }
  return result.data;
}