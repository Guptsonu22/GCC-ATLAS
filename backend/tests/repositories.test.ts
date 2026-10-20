import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDatabase, initializeSchema, closeDatabase } from '../src/db/database';
import { seedDatabase } from '../src/db/seed';
import { createCompaniesRepo } from '../src/repositories/companies';
import { createCitiesRepo } from '../src/repositories/cities';
import { createProvidersRepo } from '../src/repositories/providers';
import { createDashboardRepo } from '../src/repositories/dashboard';
import { createSavedResearchRepo } from '../src/repositories/saved-research';
import { createSavedComparisonsRepo } from '../src/repositories/saved-comparisons';
import { createSourceRecordsRepo } from '../src/repositories/source-records';
import { createAnnouncementsRepo } from '../src/repositories/announcements';
import type { Database } from 'sqlite';

let db: Database;

beforeAll(async () => {
  db = await getDatabase();
  await initializeSchema(db);
  await seedDatabase(db, { reset: true });
});

describe('companies repo', () => {
  it('lists seeded companies with pagination metadata', async () => {
    const repo = createCompaniesRepo(db);
    const result = await repo.listCompanies({ page: 1, page_size: 10 });
    expect(result.total).toBeGreaterThan(30);
    expect(result.data).toHaveLength(10);
    expect(result.total_pages).toBeGreaterThan(3);
    expect(result.data[0]!.name).toBeTruthy();
    expect(result.data[0]!.locations?.length).toBeGreaterThan(0);
  });

  it('filters by location', async () => {
    const repo = createCompaniesRepo(db);
    const result = await repo.listCompanies({ location_id: 'loc_hyderabad', page_size: 100 });
    expect(result.total).toBeGreaterThan(5);
    for (const company of result.data) {
      const inHyderabad = company.locations!.some((l) => l.location_id === 'loc_hyderabad');
      expect(inHyderabad).toBe(true);
    }
  });

  it('filters by sector and status', async () => {
    const repo = createCompaniesRepo(db);
    const result = await repo.listCompanies({ sector_id: 'sec_semi', operating_status: 'expanding' });
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.data.every((c) => c.sector?.id === 'sec_semi')).toBe(true);
  });

  it('searches by query', async () => {
    const repo = createCompaniesRepo(db);
    const result = await repo.listCompanies({ query: 'Microsoft' });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.data[0]!.name).toMatch(/Microsoft/i);
  });

  it('returns company detail with sources and announcements', async () => {
    const repo = createCompaniesRepo(db);
    const company = await repo.getCompany('com_boeing');
    expect(company).not.toBeNull();
    expect(company!.sources!.length).toBeGreaterThan(0);
    expect(company!.sources![0]!.url).toBeTruthy();
    expect((company as unknown as { announcements: unknown[] }).announcements.length).toBeGreaterThan(0);
  });

  it('returns null for unknown company', async () => {
    const repo = createCompaniesRepo(db);
    expect(await repo.getCompany('com_nope')).toBeNull();
  });
});

describe('cities repo', () => {
  it('lists locations with tracked counts', async () => {
    const repo = createCitiesRepo(db);
    const locations = await repo.listLocations();
    expect(locations.length).toBeGreaterThanOrEqual(10);
    const bengaluru = locations.find((l) => l.id === 'loc_bengaluru');
    expect(Number(bengaluru?.tracked_company_count)).toBeGreaterThan(10);
  });

  it('gets city detail with metrics and source provenance', async () => {
    const repo = createCitiesRepo(db);
    const city = await repo.getLocation('loc_bengaluru');
    expect(city).not.toBeNull();
    const metrics = (city as Record<string, unknown>).metrics as { metric_name: string; source_url: string | null; is_estimate: number }[];
    expect(metrics.length).toBeGreaterThan(3);
    expect(metrics.every((m) => m.is_estimate === 1)).toBe(true);
    expect(metrics.every((m) => m.source_url)).toBe(true);
  });

  it('compares cities and returns metrics per city', async () => {
    const repo = createCitiesRepo(db);
    const result = await repo.compareCities(['loc_bengaluru', 'loc_hyderabad', 'loc_mumbai']);
    expect(result).toHaveLength(3);
    for (const city of result) {
      expect((city as Record<string, unknown>).metrics).toBeTruthy();
    }
    const bengaluru = result.find((c) => (c as Record<string, unknown>).id === 'loc_bengaluru') as Record<string, unknown>;
    expect(bengaluru.tracked_company_count).toBe(38);
  });

  it('marks metrics as estimates with confidence levels', async () => {
    const repo = createCitiesRepo(db);
    const city = await repo.getLocation('loc_mumbai');
    const metrics = (city as Record<string, unknown>).metrics as { metric_definition: string; confidence_level: string }[];
    for (const m of metrics) {
      expect(['low', 'medium', 'high']).toContain(m.confidence_level);
      expect((m.metric_definition ?? '').length).toBeGreaterThan(10);
    }
  });
});

describe('providers repo', () => {
  it('lists providers with capabilities and operating locations', async () => {
    const repo = createProvidersRepo(db);
    const result = await repo.listProviders({ page_size: 50 });
    expect(result.total).toBeGreaterThanOrEqual(15);
    const zinnov = result.data.find((p) => p.name === 'Zinnov');
    expect(zinnov).toBeTruthy();
    expect(zinnov!.capability_list!.length).toBeGreaterThan(0);
    expect(zinnov!.operating_location_objects!.length).toBeGreaterThan(0);
    expect(zinnov!.sources!.length).toBeGreaterThan(0);
  });

  it('filters by category', async () => {
    const repo = createProvidersRepo(db);
    const result = await repo.listProviders({ category: 'legal', page_size: 50 });
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.data.every((p) => p.category === 'legal')).toBe(true);
  });

  it('filters by operating location', async () => {
    const repo = createProvidersRepo(db);
    const result = await repo.listProviders({ location_id: 'loc_kochi', page_size: 5 });
    expect(result.total).toBe(0);
  });
});

describe('dashboard repo', () => {
  it('returns stats with counting disclosure and freshness', async () => {
    const repo = createDashboardRepo(db);
    const stats = await repo.getStats();
    expect(stats.total_companies).toBeGreaterThan(30);
    expect(stats.total_providers).toBeGreaterThan(10);
    expect(stats.data_freshness.sources_verified_last_30_days).toBeGreaterThan(0);
    expect(stats.counting_note).toMatch(/tracked dataset/i);
    expect(stats.companies_by_city[0]!.count).toBeGreaterThan(10);
  });
});

describe('saved research repo', () => {
  it('creates, renames, lists and deletes saved items for a session', async () => {
    const repo = createSavedResearchRepo(db);
    const created = await repo.createSaved({
      session_key: 'test-session-1',
      name: 'BLR vs HYD',
      type: 'city_comparison',
      data: { ids: ['loc_bengaluru', 'loc_hyderabad'] },
    });
    expect(created!.name).toBe('BLR vs HYD');
    // Phase 8 security invariant: response payloads NEVER echo the session key.
    expect(created!.session_key).toBeUndefined();
    expect(created!.user_id).toBeUndefined();

    const renamed = await repo.updateSaved(created!.id, 'test-session-1', { name: 'BLR vs HYD 2026' });
    expect(renamed!.name).toBe('BLR vs HYD 2026');
    expect(renamed!.session_key).toBeUndefined();

    const list = await repo.listSaved('test-session-1');
    expect(list.length).toBe(1);
    expect(list.every((x) => (x as Record<string, unknown>).session_key === undefined)).toBe(true);

    const deleted = await repo.deleteSaved(created!.id, 'test-session-1');
    expect(deleted).toBe(true);
    expect((await repo.listSaved('test-session-1')).length).toBe(0);
  });

  it('isolates records by session key (no cross-session exposure)', async () => {
    const repo = createSavedResearchRepo(db);
    const created = await repo.createSaved({ session_key: 'session-alpha', name: 'A', type: 'custom_query', data: {} });
    expect(await repo.getSaved(created!.id, 'session-beta')).toBeFalsy();
    expect(await repo.updateSaved(created!.id, 'session-beta', { name: 'hijack' })).toBeFalsy();
    expect(await repo.deleteSaved(created!.id, 'session-beta')).toBe(false);
    await repo.deleteSaved(created!.id, 'session-alpha');
  });
});

describe('saved comparisons repo', () => {
  it('creates and lists city comparisons scoped to a session', async () => {
    const repo = createSavedComparisonsRepo(db);
    const created = await repo.createComparison('compare-session-1', {
      name: 'Top-3 hubs',
      location_ids: ['loc_bengaluru', 'loc_hyderabad', 'loc_mumbai'],
      metric_names: ['gcc_count'],
      notes: 'Phase 3 seed test',
    });
    expect(created!.name).toBe('Top-3 hubs');
    expect(created!.type).toBe('city_comparison');
    expect(JSON.parse(created!.location_ids)).toHaveLength(3);

    const list = await repo.listComparisons('compare-session-1');
    expect(list.length).toBe(1);
    expect(await repo.listComparisons('compare-session-2')).toHaveLength(0);

    expect(await repo.deleteComparison(created!.id, 'compare-session-2')).toBe(false);
    expect(await repo.deleteComparison(created!.id, 'compare-session-1')).toBe(true);
  });
});

describe('source records & announcements repos', () => {
  it('searches source records and filters by verification status and confidence', async () => {
    const repo = createSourceRecordsRepo(db);
    const all = await repo.listSourceRecords({ page_size: 100 });
    expect(all.total).toBeGreaterThan(20);
    const unverified = await repo.listSourceRecords({ verification_status: 'unverified', page_size: 100 });
    expect(unverified.total).toBeGreaterThan(5);
    const searched = await repo.listSourceRecords({ query: 'Boeing' });
    expect(searched.total).toBeGreaterThanOrEqual(1);
    const highConfidence = await repo.listSourceRecords({ confidence_level: 'high', page_size: 100 });
    expect(highConfidence.total).toBeGreaterThan(5);
    expect(highConfidence.data.every((s) => s.confidence_level === 'high')).toBe(true);
    expect(all.data.every((s) => typeof s.title === 'string')).toBe(true);
  });

  it('lists announcements with source provenance', async () => {
    const repo = createAnnouncementsRepo(db);
    const result = await repo.listAnnouncements({ page_size: 50 });
    expect(result.total).toBeGreaterThanOrEqual(6);
    const boeing = result.data.find((a) => a.company_name === 'Boeing India Engineering & Technology Center');
    expect(boeing).toBeTruthy();
    expect(boeing!.source_url).toBeTruthy();
  });
});

afterAll(async () => {
  await closeDatabase();
});