"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savedComparisonCreateSchema = exports.savedComparisonPatchSchema = exports.sessionKeySchema = exports.savedResearchUpdateSchema = exports.savedResearchCreateSchema = exports.assistantSchema = exports.compareSchema = exports.announcementFiltersSchema = exports.policyFiltersSchema = exports.sourceFiltersSchema = exports.providerFiltersSchema = exports.companyFiltersSchema = void 0;
exports.parseOr400 = parseOr400;
const zod_1 = require("zod");
exports.companyFiltersSchema = zod_1.z.object({
    query: zod_1.z.string().trim().max(200).optional(),
    sector_id: zod_1.z.string().trim().max(60).optional(),
    location_id: zod_1.z.string().trim().max(60).optional(),
    operating_status: zod_1.z.enum(['active', 'expanding', 'downsizing', 'closed', 'announced']).optional(),
    parent_company: zod_1.z.string().trim().max(200).optional(),
    is_demo_data: zod_1.z.boolean().optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    page_size: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    sort_by: zod_1.z.enum(['name', 'employee_count_india', 'india_entry_year', 'created_at']).optional(),
    sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.providerFiltersSchema = zod_1.z.object({
    query: zod_1.z.string().trim().max(200).optional(),
    category: zod_1.z.enum(['legal', 'tax', 'recruitment', 'payroll', 'eor', 'real_estate', 'consulting', 'immigration', 'other']).optional(),
    location_id: zod_1.z.string().trim().max(60).optional(),
    capability: zod_1.z.string().trim().max(120).optional(),
    is_verified: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    page_size: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
exports.sourceFiltersSchema = zod_1.z.object({
    query: zod_1.z.string().trim().max(200).optional(),
    source_type: zod_1.z.enum(['news', 'government', 'company_announcement', 'report', 'job_board', 'provider_website', 'other']).optional(),
    verification_status: zod_1.z.enum(['verified', 'unverified', 'stale', 'conflicting']).optional(),
    confidence_level: zod_1.z.enum(['high', 'medium', 'low']).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    page_size: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
exports.policyFiltersSchema = zod_1.z.object({
    state: zod_1.z.string().trim().max(100).optional(),
    status: zod_1.z.enum(['draft', 'finalized', 'announced', 'superseded']).optional(),
    policy_type: zod_1.z.enum(['incentive', 'regulation', 'infrastructure', 'talent', 'tax', 'land', 'other']).optional(),
    active_only: zod_1.z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
});
exports.announcementFiltersSchema = zod_1.z.object({
    company_id: zod_1.z.string().trim().max(60).optional(),
    location_id: zod_1.z.string().trim().max(60).optional(),
    announcement_type: zod_1.z.enum(['expansion', 'new_center', 'hiring', 'investment', 'partnership', 'policy', 'closure', 'other']).optional(),
    days: zod_1.z.coerce.number().int().min(1).max(3650).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    page_size: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
exports.compareSchema = zod_1.z.object({
    ids: zod_1.z
        .string()
        .min(1)
        .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
        .refine((arr) => arr.length >= 2 && arr.length <= 4, 'Cities compare supports 2 to 4 location ids')
        .refine((arr) => new Set(arr).size === arr.length, 'ids must be distinct'),
});
exports.assistantSchema = zod_1.z.object({
    query: zod_1.z.string().trim().min(3).max(1000),
    use_demo_mode: zod_1.z.boolean().optional(),
});
exports.savedResearchCreateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(200),
    type: zod_1.z.enum(['city_comparison', 'company_comparison', 'provider_comparison', 'custom_query']),
    data: zod_1.z.unknown(),
});
exports.savedResearchUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(200).optional(),
    data: zod_1.z.unknown().optional(),
});
/**
 * Anonymous-session ownership strategy: clients generate a stable session key
 * (localStorage uuid) and send it as `X-Session-Key` on every saved-record
 * request. All saved reads/writes are scoped to that key, so records are never
 * exposed across different users/browsers.
 */
exports.sessionKeySchema = zod_1.z
    .string()
    .min(8, 'X-Session-Key must be at least 8 characters')
    .max(64, 'X-Session-Key must be at most 64 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'X-Session-Key may only contain letters, digits, dashes and underscores');
exports.savedComparisonPatchSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(200),
});
exports.savedComparisonCreateSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(200),
    location_ids: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(60))
        .min(2, 'A comparison needs at least 2 locations')
        .max(4, 'A comparison supports at most 4 locations')
        .refine((arr) => new Set(arr).size === arr.length, 'location_ids must be distinct'),
    metric_names: zod_1.z.array(zod_1.z.string().trim().min(1).max(120)).max(20).optional(),
    notes: zod_1.z.string().trim().max(2000).optional(),
});
function parseOr400(schema, input) {
    const result = schema.safeParse(input);
    if (!result.success) {
        const err = new Error('Validation failed');
        err.status = 400;
        err.details = result.error.issues;
        throw err;
    }
    return result.data;
}
//# sourceMappingURL=validation.js.map