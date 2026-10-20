import { z } from 'zod';

/**
 * Data-quality layer for the GCC Atlas import pipeline (Phase 5).
 *
 * Every import — seed data now, CSV/API feeds later — must pass through this
 * module BEFORE any row is written to the database. Validators pin down the
 * ten documented data-quality rules of the project:
 *
 *  1. Never invent a source URL            -> valid, https-only, resolvable references
 *  2. Announced centre != operational      -> announced/never-linked centers must not
 *                                             carry an established (operational) year
 *  3. General office != confirmed GCC      -> every company needs >=1 GCC-type office
 *                                             (development_center/captive/lab/services/bpo)
 *  4. Never merge similarly named entities -> normalized-name uniqueness w/ manual register
 *  5. No mixed compensation periods/units  -> per-metric unit + period uniformity registry
 *  6. Expired policy != currently applicable -> expiry/superseded mirrors is_active
 *  7. No totals from incomplete sample     -> dashboard counts + counting_note (not here)
 *  8. Label demonstrative records          -> placeholder/example sources cannot back real records
 *  9. Flag conflicting facts               -> conflicting sources must explain themselves
 * 10. Counting methodology visible         -> non-empty metric_definition, documented fields
 *
 * Violations produce `errors` (import aborts) or `warnings` (import continues,
 * surfaced in the report and to reviewers).
 */

// ------------------------------------------------------------------ staleness
export const STALE_AFTER_DAYS = 365;

export function isStale(lastVerifiedDate: string | null | undefined, now: Date = new Date()): boolean {
  if (!lastVerifiedDate) return true; // never verified = stale evidence by definition
  const d = new Date(lastVerifiedDate);
  if (Number.isNaN(d.getTime())) return true;
  return now.getTime() - d.getTime() > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

// ------------------------------------------------------------------ identity
const LEGAL_SUFFIXES = [
  'private limited', 'pvt ltd', 'pvt. ltd.', 'limited', 'ltd', 'ltd.', 'inc', 'inc.',
  'llp', 'plc', 'corp', 'corp.', 'corporation', 'co', 'co.', 'company', 'group', 'ag', 'se', 'nv',
  'pvt', 'private',
];

/**
 * Normalized name for duplicate detection (rule 4).Strips legal suffixes,
 * brackets and punctuation. Two different legal entities can collide — the
 * `IDENTITY_EXCEPTIONS` register documents reviewed collisions so the validator
 * is never disabled wholesale.
 */
export function normalizeCompanyName(name: string): string {
  let cleaned = name
    .toLowerCase()
    .replace(/\(.*\)/g, ' ')      // drop bracketed qualifiers e.g. "Novartis India (GDD Hyderabad)"
    .replace(/[^a-z0-9\s]/g, ' ') // punctuation -> space
    .trim();
  let words = cleaned.split(/\s+/).filter(Boolean);
  // strip legal-form tokens anywhere in the name ("Target Corporation India" -> "target india")
  words = words.filter((w) => !LEGAL_SUFFIXES.includes(w));
  cleaned = words.join(' ');
  words = cleaned.split(/\s+/).filter(Boolean);
  return words.filter(Boolean).join(' ');
}

/** Collisions reviewed manually and confirmed to be DISTINCT entities (id pairs allowed to share a normalized name). */
export const IDENTITY_EXCEPTIONS: ReadonlySet<string> = new Set([
  // (none in the current dataset; examples of entries that would go here:
  //  'abc consultants|abc pharmaceuticals' if both existed)
]);

// ------------------------------------------------------------------ registries
export const GCC_OFFICE_TYPES: ReadonlySet<string> = new Set([
  'development_center', 'captive', 'innovation_lab', 'shared_services', 'bpo',
]);

/** Rule 5: the only legal unit+period combination per metric name (all cities must match). */
export const METRIC_SPECS: Readonly<Record<string, { unit: string; period: string }>> = {
  gcc_count_estimated: { unit: 'count', period: '2024–25' },
  tech_talent_pool_estimated: { unit: 'people', period: '2024–25' },
  office_rent_grade_a: { unit: 'INR/sqft/month', period: '2024–25' },
  metro_rail_km_operational: { unit: 'km', period: '2024' },
  senior_engineer_total_comp: { unit: 'INR lakh/year', period: '2024–25' },
  entry_engineer_total_comp: { unit: 'INR lakh/year', period: '2024–25' },
};

// ------------------------------------------------------------------ zod schemas
export const URL_SCHEMA = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://') || u.startsWith('http://localhost'), 'URLs must be https')
  .refine((u) => !u.includes('example.org'), 'example.org is not a permitted citation target');

export const ROW_SCHEMAS = {
  source: z.object({
    id: z.string().min(3),
    title: z.string().min(3),
    url: URL_SCHEMA,
    publisher: z.string().nullable(),
    source_type: z.enum(['news', 'government', 'company_announcement', 'report', 'job_board', 'provider_website', 'other']),
    publication_date: z.string().nullable(),
    last_verified_date: z.string().nullable(),
    verification_status: z.enum(['verified', 'unverified', 'stale', 'conflicting']),
    confidence_level: z.enum(['high', 'medium', 'low']),
    notes: z.string().nullable(),
  }),
  company: z.object({
    id: z.string().min(3),
    name: z.string().min(2),
    parent_company: z.string().nullable(),
    sector_id: z.string().min(2),
    headquarters_country: z.string().min(2),
    headquarters_city: z.string().nullable(),
    india_entry_year: z.number().int().min(1950).max(2100).nullable(),
    operating_status: z.enum(['active', 'expanding', 'downsizing', 'closed', 'announced']),
    employee_count_india: z.number().int().positive().nullable(),
    description: z.string().min(20),
    website: URL_SCHEMA.nullable(),
    source_id: z.string().min(3),
    locations: z.array(
      z.object({
        id: z.string().optional(),
        location_id: z.string().min(3),
        office_type: z.enum(['headquarters', 'development_center', 'bpo', 'captive', 'shared_services', 'innovation_lab', 'other']),
        is_primary: z.boolean().optional(),
        established_year: z.number().int().min(1950).max(2100).nullable().optional(),
      }),
    ).min(1),
  }),
  metric: z.object({
    id: z.string().optional(),
    location_id: z.string().min(3),
    metric_name: z.string().min(3),
    metric_value: z.number().nullable(),
    metric_unit: z.string().min(2),
    metric_period: z.string().min(4),
    metric_definition: z.string().min(20),   // rule 10: counting basis mandatory
    source_id: z.string().min(3),
    is_estimate: z.boolean(),
    confidence_level: z.enum(['high', 'medium', 'low']),
  }),
  policy: z.object({
    id: z.string().min(3),
    title: z.string().min(5),
    state: z.string().min(2),
    policy_type: z.enum(['incentive', 'regulation', 'infrastructure', 'talent', 'tax', 'land', 'other']),
    status: z.enum(['draft', 'finalized', 'announced', 'superseded']),
    description: z.string().min(20),
    benefits: z.string().min(2),                    // JSON-encoded string[]
    normalized_benefits: z.string().nullable(),     // JSON-encoded NormalizedBenefit[]
    eligibility_criteria: z.string(),
    effective_date: z.string().nullable(),
    expiry_date: z.string().nullable(),
    source_id: z.string().min(3),
    is_active: z.number().int().min(0).max(1),
  }),
  announcement: z.object({
    id: z.string().min(3),
    company_id: z.string().nullable(),
    location_id: z.string().nullable(),
    title: z.string().min(5),
    summary: z.string().min(20).nullable(),
    announcement_type: z.enum(['expansion', 'new_center', 'hiring', 'investment', 'partnership', 'policy', 'closure', 'other']),
    announcement_date: z.string().min(4),
    source_id: z.string().min(3),
    employee_count_mentioned: z.number().int().positive().nullable(),
    investment_amount_usd: z.number().positive().nullable(),
    is_verified: z.number().int().min(0).max(1),
  }),
  provider: z.object({
    id: z.string().min(3),
    name: z.string().min(2),
    category: z.enum(['legal', 'tax', 'recruitment', 'payroll', 'eor', 'real_estate', 'consulting', 'immigration', 'other']),
    subcategory: z.string().nullable(),
    description: z.string().min(20),
    website: URL_SCHEMA,
    headquarters_location_id: z.string().nullable(),
    operating_locations: z.array(z.string().min(3)).min(1),
    capabilities: z.array(z.string().min(3)).min(1),
    case_studies: z.array(z.unknown()).nullable(),
    founded_year: z.number().int().min(1700).max(2100).nullable(), // global founding year (JLL lineage goes back to 1783)
    employee_count: z.number().int().positive().nullable(),
    is_verified: z.number().int().min(0).max(1),
    verification_notes: z.string().nullable(),
    source_id: z.string().min(3),
  }),
} as const;

/** Rule 8: demonstrative (placeholder) sources are detectable by URL or notes. */
export function isDemonstrativeSource(s: { url: string; notes?: string | null; title?: string }): boolean {
  const haystack = `${s.url} ${s.notes ?? ''} ${s.title ?? ''}`.toLowerCase();
  return haystack.includes('example.com') || haystack.includes('placeholder') || haystack.includes('demonstrat');
}

// ------------------------------------------------------------------ validator
export interface SeedDataset {
  sectors: { id: string; name: string }[];
  locations: { id: string; name: string; state: string; tier: string | null }[];
  sources: {
    id: string; title: string; url: string; publisher: string | null; source_type: string;
    publication_date: string | null; last_verified_date?: string | null;
    verification_status: string; confidence_level: string; notes: string | null;
  }[];
  companies: {
    id: string; name: string; parent_company: string | null; sector_id: string;
    headquarters_country: string; headquarters_city: string | null; india_entry_year: number | null;
    operating_status: string; employee_count_india: number | null; description: string;
    website: string | null; source_id: string;
    locations: { id?: string; location_id: string; office_type: string; is_primary?: boolean; established_year?: number | null }[];
  }[];
  cityMetrics: {
    id?: string; location_id: string; metric_name: string; metric_value: number | null;
    metric_unit: string; metric_period: string; metric_definition: string;
    source_id: string; is_estimate: boolean; confidence_level: string;
  }[];
  policies: {
    id: string; title: string; state: string; policy_type: string; status: string;
    description: string; benefits: string; normalized_benefits: string | null;
    eligibility_criteria: string; effective_date: string | null; expiry_date: string | null;
    source_id: string; is_active: number;
  }[];
  announcements: {
    id: string; company_id: string | null; location_id: string | null; title: string; summary: string | null;
    announcement_type: string; announcement_date: string; source_id: string;
    employee_count_mentioned: number | null; investment_amount_usd: number | null; is_verified: number;
  }[];
  providers: {
    id: string; name: string; category: string; subcategory: string | null; description: string;
    website: string; headquarters_location_id: string | null; operating_locations: string[];
    capabilities: string[]; case_studies: unknown[] | null; founded_year: number | null;
    employee_count: number | null; is_verified: number; verification_notes: string | null;
    source_id: string;
  }[];
}

export interface QualityReport {
  errors: string[];
  warnings: string[];
  staleSources: string[]; // rule: stale evidence bucket
}

export function validateSeedDataset(data: SeedDataset, now: Date = new Date()): QualityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const staleSources: string[] = [];

  // ---- shape validation (zod, with per-row context in the message)
  for (const s of data.sources) {
    const r = ROW_SCHEMAS.source.safeParse(s);
    if (!r.success) errors.push(`source ${s.id}: ${r.error.issues.map((i) => i.message).join('; ')}`);
  }
  for (const c of data.companies) {
    const r = ROW_SCHEMAS.company.safeParse(c);
    if (!r.success) errors.push(`company ${c.id}: ${r.error.issues.map((i) => i.message).join('; ')}`);
  }
  for (const m of data.cityMetrics) {
    const r = ROW_SCHEMAS.metric.safeParse(m);
    if (!r.success) errors.push(`metric ${m.location_id}/${m.metric_name}: ${r.error.issues.map((i) => i.message).join('; ')}`);
  }
  for (const p of data.policies) {
    const r = ROW_SCHEMAS.policy.safeParse(p);
    if (!r.success) errors.push(`policy ${p.id}: ${r.error.issues.map((i) => i.message).join('; ')}`);
  }
  for (const a of data.announcements) {
    const r = ROW_SCHEMAS.announcement.safeParse(a);
    if (!r.success) errors.push(`announcement ${a.id}: ${r.error.issues.map((i) => i.message).join('; ')}`);
  }
  for (const p of data.providers) {
    const r = ROW_SCHEMAS.provider.safeParse(p);
    if (!r.success) errors.push(`provider ${p.id}: ${r.error.issues.map((i) => i.message).join('; ')}`);
  }

  // ---- reference integrity: every citation resolves to a declared source
  const sourceIds = new Set(data.sources.map((s) => s.id));
  const locationIds = new Set(data.locations.map((l) => l.id));
  const sectorIds = new Set(data.sectors.map((sec) => sec.id));
  const companyIds = new Set(data.companies.map((c) => c.id));

  const missingSource = (owner: string, sourceId: string) => {
    if (!sourceIds.has(sourceId)) errors.push(`${owner}: references unknown source '${sourceId}'`);
  };

  const demonstrativeIds = data.sources.filter(isDemonstrativeSource).map((s) => s.id);
  const citingDemonstrative = (owner: string, sourceId: string) => {
    if (demonstrativeIds.includes(sourceId)) errors.push(`${owner}: cites demonstrative placeholder source '${sourceId}' (rule 8)`);
  };

  for (const c of data.companies) {
    missingSource(`company ${c.id}`, c.source_id);
    citingDemonstrative(`company ${c.id}`, c.source_id);
    if (!sectorIds.has(c.sector_id)) errors.push(`company ${c.id}: unknown sector '${c.sector_id}'`);
    for (const loc of c.locations) {
      if (!locationIds.has(loc.location_id)) errors.push(`company ${c.id}: unknown location '${loc.location_id}'`);
    }
  }
  for (const m of data.cityMetrics) {
    missingSource(`metric ${m.location_id}/${m.metric_name}`, m.source_id);
    citingDemonstrative(`metric ${m.location_id}/${m.metric_name}`, m.source_id);
    if (!locationIds.has(m.location_id)) errors.push(`metric ${m.location_id}/${m.metric_name}: unknown location`);
  }
  for (const p of data.policies) {
    missingSource(`policy ${p.id}`, p.source_id);
    citingDemonstrative(`policy ${p.id}`, p.source_id);
  }
  for (const a of data.announcements) {
    missingSource(`announcement ${a.id}`, a.source_id);
    citingDemonstrative(`announcement ${a.id}`, a.source_id);
    if (a.company_id && !companyIds.has(a.company_id)) errors.push(`announcement ${a.id}: unknown company '${a.company_id}'`);
    if (a.location_id && !locationIds.has(a.location_id)) errors.push(`announcement ${a.id}: unknown location '${a.location_id}'`);
  }
  for (const p of data.providers) {
    missingSource(`provider ${p.id}`, p.source_id);
    citingDemonstrative(`provider ${p.id}`, p.source_id);
    if (p.headquarters_location_id && !locationIds.has(p.headquarters_location_id)) errors.push(`provider ${p.id}: unknown HQ location`);
    for (const locId of p.operating_locations) {
      if (!locationIds.has(locId)) errors.push(`provider ${p.id}: unknown operating location '${locId}'`);
    }
  }

  // unique ids across every entity set
  const seenIds = new Map<string, string>();
  const checkUniqueId = (entity: string, id: string) => {
    const first = seenIds.get(id);
    if (first) errors.push(`duplicate id '${id}' used by ${first} and ${entity}`);
    else seenIds.set(id, entity);
  };
  data.sectors.forEach((s) => checkUniqueId('sector', s.id));
  data.locations.forEach((l) => checkUniqueId('location', l.id));
  data.sources.forEach((s) => checkUniqueId('source', s.id));
  data.companies.forEach((c) => checkUniqueId('company', c.id));
  data.providers.forEach((p) => checkUniqueId('provider', p.id));

  // ---- rule 3: a company record must show GCC-typed evidence, not just offices
  for (const c of data.companies) {
    if (!c.locations.some((loc) => GCC_OFFICE_TYPES.has(loc.office_type))) {
      errors.push(`company ${c.id} (${c.name}): no GCC-type office (development_center/captive/lab/services/bpo) — record would be a general office`);
    }
  }

  // ---- rule 4: normalized-name uniqueness with a manual collision register
  const byNormalName = new Map<string, string[]>();
  for (const c of data.companies) {
    const key = normalizeCompanyName(c.name);
    const list = byNormalName.get(key) ?? [];
    list.push(c.id);
    byNormalName.set(key, list);
  }
  for (const [key, ids] of byNormalName) {
    if (ids.length > 1 && !IDENTITY_EXCEPTIONS.has(ids.slice().sort().join('|'))) {
      errors.push(`companies share normalized name '${key}' (${ids.join(', ')}) — confirm identity before merging (rule 4; add pair to IDENTITY_EXCEPTIONS if genuinely distinct)`);
    }
  }

  // ---- rule 5: metric unit + period uniformity per metric name
  for (const [metricName, spec] of Object.entries(METRIC_SPECS)) {
    const rows = data.cityMetrics.filter((m) => m.metric_name === metricName);
    for (const m of rows) {
      if (m.metric_unit !== spec.unit) {
        errors.push(`metric ${m.location_id}/${metricName}: unit '${m.metric_unit}' violates registry '${spec.unit}' (rule 5)`);
      }
      if (m.metric_period !== spec.period) {
        errors.push(`metric ${m.location_id}/${metricName}: period '${m.metric_period}' violates registry '${spec.period}' (rule 5 — all cities must use the same period)`);
      }
    }
  }
  for (const m of data.cityMetrics) {
    if (!(m.metric_name in METRIC_SPECS)) {
      warnings.push(`metric ${m.location_id}/${m.metric_name}: not in METRIC_SPECS registry — register unit/period before comparing across cities`);
    }
  }

  // ---- rule 6: expired/superseded policies must not be marked currently applicable
  for (const p of data.policies) {
    const expired = p.expiry_date ? new Date(p.expiry_date).getTime() < now.getTime() : false;
    if (expired && p.is_active === 1) {
      errors.push(`policy ${p.id}: expiry_date ${p.expiry_date} is past but is_active=1 (rule 6)`);
    }
    if (p.status === 'superseded' && p.is_active === 1) {
      errors.push(`policy ${p.id}: status 'superseded' but is_active=1 (rule 6)`);
    }
    if ((p.status === 'draft' || p.status === 'announced') && p.is_active === 1 && (p.effective_date ?? '') === '') {
      warnings.push(`policy ${p.id}: ${p.status} with no effective_date — is_active=1 is promotive; verify before presenting as applicable`);
    }
  }

  // ---- rule 2: announced-but-not-operational centers cannot carry established years
  // (future established years are invalid for ANY company location)
  const thisYear = now.getFullYear();
  for (const c of data.companies) {
    for (const loc of c.locations) {
      if (loc.established_year && loc.established_year > thisYear) {
        errors.push(`company ${c.id} (${loc.location_id}): location has a future established year (rule 2)`);
      }
    }
  }
  for (const a of data.announcements) {
    if (a.announcement_type === 'new_center' && a.is_verified === 0 && a.company_id && a.location_id) {
      const company = data.companies.find((c) => c.id === a.company_id);
      const loc = company?.locations.find((l) => l.location_id === a.location_id);
      if (loc?.established_year) {
        errors.push(`announcement ${a.id}: unverified new-center announcement, but company location already records an operational year (rule 2)`);
      }
      warnings.push(`announcement ${a.id}: unverified new-center announcement — treat as announced, never operational, until re-verified`);
    }
    if (a.announcement_type === 'new_center' && a.company_id && a.location_id) {
      const company = data.companies.find((c) => c.id === a.company_id);
      const loc = company?.locations.find((l) => l.location_id === a.location_id);
      if (loc?.established_year && loc.established_year > thisYear) {
        errors.push(`announcement ${a.id}: new center has a future established year (rule 2)`);
      }
    }
  }

  // ---- rule 9: conflicting sources must explain the conflict
  for (const s of data.sources) {
    if (s.verification_status === 'conflicting' && !(s.notes ?? '').trim()) {
      errors.push(`source ${s.id}: marked conflicting but notes do not explain the conflict (rule 9)`);
    }
  }

  // ---- rule 8: demonstrative sources must be labeled as such
  for (const s of data.sources) {
    if (isDemonstrativeSource(s)) {
      const labeled = `${s.title} ${s.notes ?? ''}`.toLowerCase();
      if (!(labeled.includes('placeholder') || labeled.includes('demonstrat'))) {
        errors.push(`source ${s.id}: looks demonstrative (placeholder/example URL) but is not labeled as one (rule 8)`);
      }
    }
  }

  // ---- staleness (dashboard bucket + reviewer warnings)
  for (const s of data.sources) {
    if (isStale(s.last_verified_date, now)) {
      staleSources.push(s.id);
      if (s.verification_status === 'verified') {
        warnings.push(`source ${s.id}: verified >${STALE_AFTER_DAYS}d ago — stale evidence, schedule re-verification`);
      }
    }
  }

  // ---- warnings: homepage-cited news/report sources need an explanatory note
  for (const s of data.sources) {
    if ((s.source_type === 'news' || s.source_type === 'report') && s.notes === null) {
      warnings.push(`source ${s.id}: ${s.source_type} record without notes — document whether the URL is the exact article or a homepage`);
    }
  }

  return { errors, warnings, staleSources };
}
