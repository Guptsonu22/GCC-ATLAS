import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { getDatabase, initializeSchema, closeDatabase } from '../src/db/database';
import { seedDatabase } from '../src/db/seed';
import {
  validateSeedDataset,
  normalizeCompanyName,
  isStale,
  isDemonstrativeSource,
  METRIC_SPECS,
  GCC_OFFICE_TYPES,
  type SeedDataset,
} from '../src/data/quality';
import type { Database as SqliteDatabase } from 'sqlite';

let db: SqliteDatabase;

beforeAll(async () => {
  db = await getDatabase();
  await initializeSchema(db);
  await seedDatabase(db, { reset: true });
});

afterAll(async () => {
  await closeDatabase();
});

// ------------------------------------------------------------------ helpers
function baseDataset(): SeedDataset {
  return {
    sectors: [{ id: 'sec_tech', name: 'Technology' }],
    locations: [{ id: 'loc_test', name: 'Test City', state: 'Test State', tier: 'tier1' }],
    sources: [{
      id: 'src_test', title: 'Test source', url: 'https://press.test/article', publisher: 'Test Publisher',
      source_type: 'news', publication_date: '2026-01-01', last_verified_date: '2026-10-01',
      verification_status: 'verified', confidence_level: 'medium', notes: 'Fixture source',
    }],
    companies: [{
      id: 'com_test', name: 'Test GCC India', parent_company: 'Test Global Inc.', sector_id: 'sec_tech',
      headquarters_country: 'United States', headquarters_city: 'Testville', india_entry_year: 2020,
      operating_status: 'active', employee_count_india: null, description: 'A sufficiently detailed fixture description for validation.',
      website: 'https://www.testglobal.test', source_id: 'src_test',
      locations: [{ location_id: 'loc_test', office_type: 'development_center', is_primary: true, established_year: 2020 }],
    }],
    cityMetrics: [],
    policies: [],
    announcements: [],
    providers: [],
  };
}

function clone(data: SeedDataset): SeedDataset {
  return JSON.parse(JSON.stringify(data)) as SeedDataset;
}

// ------------------------------------------------------------------ quality rules
describe('validateSeedDataset — data-quality rules', () => {
  it('rule 1: rejects non-https citations', () => {
    const data = clone(baseDataset());
    data.sources[0]!.url = 'http://insecure.example/doc';
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/URLs must be https/);
  });

  it('rule 2: unverified new-center announcement cannot coincide with an operational year', () => {
    const data = clone(baseDataset());
    data.announcements.push({
      id: 'ann_bad', company_id: 'com_test', location_id: 'loc_test', title: 'Test expands',
      summary: 'Unverified news claims a new center was announced.',
      announcement_type: 'new_center', announcement_date: '2026-01-01', source_id: 'src_test',
      employee_count_mentioned: null, investment_amount_usd: null, is_verified: 0,
    });
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/already records an operational year/);
  });

  it('rule 2: future established years are rejected', () => {
    const data = clone(baseDataset());
    data.companies[0]!.locations[0]!.established_year = 2029;
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/future established year/);
  });

  it('rule 3: a company backed only by general offices is rejected', () => {
    const data = clone(baseDataset());
    data.companies[0]!.locations = [{ location_id: 'loc_test', office_type: 'other' }];
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/no GCC-type office/);
  });

  it('rule 4: similarly named companies collide unless registered as distinct', () => {
    const data = clone(baseDataset());
    const second = clone(data.companies[0]!);
    second.id = 'com_test2';
    second.name = 'Test GCC India Ltd.'; // normalizes identically
    data.companies.push(second);
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/confirm identity before merging/);
  });

  it('rule 5: mixing metric units across cities is rejected', () => {
    const data = clone(baseDataset());
    data.cityMetrics.push(
      { location_id: 'loc_test', metric_name: 'senior_engineer_total_comp', metric_value: 40,
        metric_unit: 'INR lakh/year', metric_period: '2024–25', metric_definition: 'Indicative midpoint of commonly reported annual totals.',
        source_id: 'src_test', is_estimate: true, confidence_level: 'low' },
      { location_id: 'loc_test', metric_name: 'senior_engineer_total_comp', metric_value: 4200,
        metric_unit: 'INR per month', metric_period: '2024–25', metric_definition: 'Same figure expressed per month — mixing units breaks comparison.',
        source_id: 'src_test', is_estimate: true, confidence_level: 'low' },
    );
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/violates registry 'INR lakh\/year'/);
  });

  it('rule 6: an expired policy must not be flagged currently applicable', () => {
    const data = clone(baseDataset());
    data.policies.push({
      id: 'pol_bad', title: 'Expired fixture policy', state: 'Test State', policy_type: 'incentive',
      status: 'superseded', description: 'A policy fixture that expired last year but pretends to be active.',
      benefits: JSON.stringify(['Not applicable']), normalized_benefits: null,
      eligibility_criteria: 'n/a', effective_date: '2020-01-01', expiry_date: '2025-01-01',
      source_id: 'src_test', is_active: 1,
    });
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/rule 6/);
  });

  it('rule 8: placeholder/example sources cannot back real records and must be labeled', () => {
    const data = clone(baseDataset());
    data.companies[0]!.source_id = 'src_decoy';
    data.sources.push({
      id: 'src_decoy', title: 'Example page', url: 'https://example.com/page', publisher: null,
      source_type: 'other', publication_date: null, last_verified_date: '2026-01-01',
      verification_status: 'unverified', confidence_level: 'low', notes: 'Notes that do not mention placeholder at all',
    });
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    const errors = report.errors.join('\n');
    expect(errors).toMatch(/rule 8/);
  });

  it('rule 9: conflicting sources must explain the conflict', () => {
    const data = clone(baseDataset());
    data.sources[0]!.verification_status = 'conflicting';
    data.sources[0]!.notes = '';   // no explanation
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/rule 9/);
  });

  it('missing sources: citing an unknown source aborts the import', () => {
    const data = clone(baseDataset());
    data.companies[0]!.source_id = 'src_does_not_exist';
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors.join('\n')).toMatch(/unknown source/);
  });

  it('stale evidence: sources verified more than 365 days ago are flagged', () => {
    const data = clone(baseDataset());
    data.sources[0]!.last_verified_date = '2025-01-01';
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.staleSources).toContain('src_test');
    expect(report.warnings.join('\n')).toMatch(/stale evidence/);
  });
});

// ------------------------------------------------------------------ pure helpers
describe('pure quality helpers', () => {
  it('normalizeCompanyName strips suffixes, brackets and punctuation', () => {
    expect(normalizeCompanyName('Novartis India (GDD Hyderabad)')).toBe('novartis india');
    expect(normalizeCompanyName('Target Corporation India')).toBe('target india');
    expect(normalizeCompanyName('ABC Consultants Pvt. Ltd.')).toBe('abc consultants');
    expect(normalizeCompanyName('IBM India')).toBe('ibm india');
  });

  it('isStale treats missing/invalid dates as stale and honors the 365-day window', () => {
    const now = new Date('2026-10-20');
    expect(isStale(null, now)).toBe(true);
    expect(isStale('2026-10-01', now)).toBe(false);
    expect(isStale('2025-06-01', now)).toBe(true);
  });

  it('isDemonstrativeSource detects placeholder/example records', () => {
    expect(isDemonstrativeSource({ url: 'https://example.com', title: 'Placeholder — not used' })).toBe(true);
    expect(isDemonstrativeSource({ url: 'https://economictimes.indiatimes.com', notes: 'article' })).toBe(false);
  });

  it('registries cover the tracked metric names and GCC office types', () => {
    for (const name of ['gcc_count_estimated', 'tech_talent_pool_estimated', 'office_rent_grade_a', 'metro_rail_km_operational', 'senior_engineer_total_comp', 'entry_engineer_total_comp']) {
      expect(METRIC_SPECS[name]).toBeDefined();
    }
    for (const t of ['development_center', 'captive', 'innovation_lab', 'shared_services', 'bpo']) {
      expect(GCC_OFFICE_TYPES.has(t)).toBe(true);
    }
    expect(GCC_OFFICE_TYPES.has('other')).toBe(false);
  });
});

// ------------------------------------------------------------------ curated dataset through the validator
describe('curated Phase-1 dataset', () => {
  it('passes validation with zero errors', async () => {
    const seed = await import('../src/data/seed-data');
    const data: SeedDataset = {
      sectors: seed.sectors.map((s) => ({ id: s.id, name: s.name })),
      locations: seed.locations.map((l) => ({ id: l.id, name: l.name, state: l.state, tier: l.tier ?? null })),
      sources: seed.sources,
      companies: seed.companies,
      cityMetrics: seed.cityMetrics,
      policies: seed.policies,
      announcements: seed.announcements,
      providers: seed.providers,
    };
    const report = validateSeedDataset(data, new Date('2026-10-20'));
    expect(report.errors).toEqual([]);
    // staleness is honestly represented: several homepage/wiki sources are stale
    expect(report.staleSources.length).toBeGreaterThanOrEqual(5);
  });
});

// ------------------------------------------------------------------ import pipeline (rerun-safe upserts)
describe('import pipeline (validate-first, rerun-safe)', () => {
  it('running the import twice yields identical row counts (no duplicates)', async () => {
    const before = await db.get<{ n: number }>(
      "SELECT COUNT(*) AS n FROM companies WHERE id LIKE 'com_%'",
    );
    await seedDatabase(db);
    const after = await db.get<{ n: number }>("SELECT COUNT(*) AS n FROM companies WHERE id LIKE 'com_%'");
    expect(after?.n).toBe(before?.n);

    const dupes = await db.all<{ name: string }>('SELECT name FROM companies GROUP BY name HAVING COUNT(*) > 1');
    expect(dupes).toHaveLength(0);
  });

  it('upsert refreshes curated content for an existing stable id instead of duplicating', async () => {
    const original = (await db.get<{ description: string }>("SELECT description FROM companies WHERE id = 'com_microsoft'"))?.description;
    await db.run('UPDATE companies SET description = ? WHERE id = ?', ['mutated for rerun test', 'com_microsoft']);
    await seedDatabase(db);
    const restored = (await db.get<{ description: string }>("SELECT description FROM companies WHERE id = 'com_microsoft'"))?.description;
    expect(restored).toBe(original);
    expect(restored).not.toBe('mutated for rerun test');
  });

  it('company_locations and source_records stay unique on rerun', async () => {
    const locBefore = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM company_locations');
    await seedDatabase(db);
    const locAfter = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM company_locations');
    expect(locAfter?.n).toBe(locBefore?.n);

    const srcBefore = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM source_records');
    await seedDatabase(db);
    const srcAfter = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM source_records');
    expect(srcAfter?.n).toBe(srcBefore?.n);
  });

  it('saved_research rows survive re-imports (user data untouched)', async () => {
    await db.run(
      "INSERT INTO saved_research (id, session_key, name, type, data) VALUES ('sr_test', 'sig_test_rerun', 'Keep me', 'city_comparison', '{}')",
    );
    await seedDatabase(db);
    const row = await db.get<{ id: string }>("SELECT id FROM saved_research WHERE session_key = 'sig_test_rerun'");
    expect(row?.id).toBe('sr_test');
    await db.run("DELETE FROM saved_research WHERE session_key = 'sig_test_rerun'");
  });
});

// ------------------------------------------------------------------ dashboard verification buckets
describe('dashboard verification buckets (record-level)', () => {
  it('companies break into verified/awaiting/stale/conflicting over the seeded data', async () => {
    const repo = (await import('../src/repositories/dashboard')).createDashboardRepo(db);
    const stats = await repo.getStats();
    const v = stats.companies_verification;
    expect(v.total).toBeGreaterThan(30);
    expect(v.verified + v.awaiting_verification + v.stale + v.conflicting).toBe(v.total);
    expect(v.verified).toBeGreaterThan(5);
    expect(v.awaiting_verification).toBeGreaterThan(10);
  });

  it('policies verification flags the unverified state frameworks', async () => {
    const repo = (await import('../src/repositories/dashboard')).createDashboardRepo(db);
    const stats = await repo.getStats();
    expect(stats.policies_verification.awaiting_verification).toBeGreaterThanOrEqual(2);
    expect(stats.policies_verification.total).toBe(8);
  });

  it('coverage arrays include cities and states plus the documented definitions', async () => {
    const repo = (await import('../src/repositories/dashboard')).createDashboardRepo(db);
    const stats = await repo.getStats();
    expect(stats.companies_by_city.length).toBeGreaterThan(5);
    expect(stats.policies_by_state.length).toBeGreaterThan(5);
    expect(stats.verification_definitions).toMatch(/365/);
  });
});

// ------------------------------------------------------------------ source usage (evidence explorer)
describe('source usage (reverse references)', () => {
  it('a cited source lists the records that rely on it', async () => {
    const repo = (await import('../src/repositories/source-records')).createSourceRecordsRepo(db);
    const usage = await repo.getSourceUsage('src_karnataka_gov');
    expect(usage?.source.id).toBe('src_karnataka_gov');
    expect(usage?.usage.policies.some((p: { id: string }) => p.id === 'pol_karnataka')).toBe(true);
    expect(usage?.usage.announcements.length).toBeGreaterThan(0);
    expect(usage?.usage.metrics.length).toBe(0);
  });

  it('an uncited source reports empty usage', async () => {
    const repo = (await import('../src/repositories/source-records')).createSourceRecordsRepo(db);
    const usage = await repo.getSourceUsage('src_github_tcs');
    expect(usage?.usage.companies).toHaveLength(0);
    expect(usage?.usage.policies).toHaveLength(0);
  });

  it('returns undefined for unknown sources', async () => {
    const repo = (await import('../src/repositories/source-records')).createSourceRecordsRepo(db);
    expect(await repo.getSourceUsage('src_nope')).toBeUndefined();
  });
});
