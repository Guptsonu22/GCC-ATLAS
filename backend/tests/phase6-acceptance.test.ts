/* eslint-disable no-console */
import request from 'supertest';
import { createHash } from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Express } from 'express';

/**
 * Phase 6 acceptance journeys, executed end-to-end against the real app on a
 * seeded in-memory DB (NODE_ENV=test so rate limiters pass through).
 */

let app: Express;

beforeAll(async () => {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
  const { createApp } = await import('../src/index');
  app = await createApp();
});

afterAll(async () => {
  const { closeDatabase } = await import('../src/db/database');
  await closeDatabase();
});

describe('Journey 1 — search for a GCC and open its profile', () => {
  it('search returns matches; detail returns full provenance record', async () => {
    const list = await request(app).get('/api/companies?query=microsoft&page_size=10');
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);
    const hit = list.body.data.find((r: { name: string }) => r.name.includes('Microsoft'));
    expect(hit).toBeTruthy();

    const detail = await request(app).get(`/api/companies/${hit.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.locations.length).toBeGreaterThan(0);
    expect(detail.body.sources.length).toBeGreaterThan(0);
    for (const src of detail.body.sources) expect(src.url).toMatch(/^https:/);
  });

  it('no-match search yields a well-formed empty page (journey 6)', async () => {
    const res = await request(app).get('/api/companies?query=zzz-no-such-company-zzz');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

describe('Journey 2 — filter by city and sector', () => {
  it('combined city + sector filter narrows results coherently', async () => {
    const sectors = await request(app).get('/api/sectors');
    const itSector = sectors.body.data.find((s: { name: string }) => /^[iI]nformation/.test(s.name)) ?? sectors.body.data[0];
    const filtered = await request(app).get(`/api/companies?sector_id=${itSector.id}&location_id=loc_pune&page_size=100`);
    expect(filtered.status).toBe(200);
    for (const row of filtered.body.data) expect(row.sector_id).toBe(itSector.id);
  });
});

describe('Journey 3 — compare cities side by side', () => {
  it('returns per-city metrics with definition, unit, period and source', async () => {
    const res = await request(app).get('/api/cities/compare?ids=loc_bengaluru,loc_hyderabad');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    for (const city of res.body.data) {
      expect(city.metrics.length).toBeGreaterThan(0);
      for (const m of city.metrics) {
        expect(m.metric_definition).toBeTruthy();
        if (m.metric_value !== null) expect(m.source_url).toMatch(/^https:/);
      }
    }
  });
});

describe('Journey 4 — open a source from a record', () => {
  it('source detail resolves and exposes reverse usage', async () => {
    const list = await request(app).get('/api/companies?page_size=5');
    const company = list.body.data[0];
    const detail = await request(app).get(`/api/companies/${company.id}`);
    const sourceId = detail.body.sources?.[0]?.id;
    expect(sourceId).toBeTruthy();

    const usage = await request(app).get(`/api/source-records/${sourceId}`);
    expect(usage.status).toBe(200);
    expect(usage.body.source.id).toBe(sourceId);
    expect(usage.body.source.verification_status).toMatch(/^(verified|unverified|stale|conflicting)$/);
    expect(usage.body.usage).toHaveProperty('companies');
  });
});

describe('Journey 5 — save, reopen, rename, delete', () => {
  const key = `acceptance${Math.floor(Math.random() * 1e9).toString(36)}`;

  it('persists comparison across calls under one session key', async () => {
    const create = await request(app)
      .post('/api/saved-comparisons')
      .set('X-Session-Key', key)
      .send({ name: 'Phase-6 journey', location_ids: ['loc_bengaluru', 'loc_chennai'] });
    expect(create.status).toBe(201);

    const list = await request(app).get('/api/saved-comparisons').set('X-Session-Key', key);
    expect(list.body.data.some((s: { id: string }) => s.id === create.body.id)).toBe(true);

    const reopened = await request(app).get(`/api/saved-comparisons/${create.body.id}`).set('X-Session-Key', key);
    expect(reopened.status).toBe(200);
    expect(JSON.parse(reopened.body.location_ids)).toEqual(['loc_bengaluru', 'loc_chennai']);
  });

  it('rename updates the record', async () => {
    const list = await request(app).get('/api/saved-comparisons').set('X-Session-Key', key);
    const saved = list.body.data[0];
    const patch = await request(app)
      .patch(`/api/saved-comparisons/${saved.id}`)
      .set('X-Session-Key', key)
      .send({ name: 'Renamed journey' });
    expect(patch.status).toBe(200);
    expect(patch.body.name).toBe('Renamed journey');
  });

  it('other sessions cannot read it (privacy)', async () => {
    const list = await request(app).get('/api/saved-comparisons').set('X-Session-Key', 'other-session-key-99');
    expect(list.body.data.length).toBe(0);
  });

  it('delete removes it; 404 afterwards', async () => {
    const list = await request(app).get('/api/saved-comparisons').set('X-Session-Key', key);
    const saved = list.body.data[0];
    const del = await request(app).delete(`/api/saved-comparisons/${saved.id}`).set('X-Session-Key', key);
    expect(del.status).toBe(204);
    const gone = await request(app).get(`/api/saved-comparisons/${saved.id}`).set('X-Session-Key', key);
    expect(gone.status).toBe(404);
  });
});

describe('Saved research — save a company for later', () => {
  it('accepts a company save scoped to the session and lists it', async () => {
    const k = `companysave${Math.floor(Math.random() * 1e9).toString(36)}`;
    const create = await request(app)
      .post('/api/saved-research')
      .set('X-Session-Key', k)
      .send({ name: 'Microsoft — company profile', type: 'company_comparison', data: JSON.stringify({ company_id: "com_microsoft" }) });
    expect([200, 201]).toContain(create.status);
    const list = await request(app).get('/api/saved-research').set('X-Session-Key', k);
    expect(list.body.data[0].data).toContain("com_microsoft");
  });
});

describe('Journey 7 — failed requests handled gracefully', () => {
  it('validation errors carry details; unknown routes 404 envelope', async () => {
    const badCompare = await request(app).get('/api/cities/compare?ids=only-one');
    expect(badCompare.status).toBe(400);
    expect(badCompare.body.error.code).toBe('validation_error');

    const missing = await request(app).get('/api/does-not-exist');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('not_found');

    const noSession = await request(app).get('/api/saved-comparisons');
    expect([400, 401]).toContain(noSession.status);
    expect(noSession.body.error.message.length).toBeGreaterThan(0);
  });

  it('event ingest rejects unknown event names with a clean error envelope', async () => {
    const res = await request(app).post('/api/events').send({ name: 'not_in_catalog' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });
});

describe('Provider directory', () => {
  it('capability filter matches providers that declare the capability', async () => {
    const all = await request(app).get('/api/providers?page_size=100');
    expect(all.status).toBe(200);
    expect(all.body.total).toBeGreaterThan(0);
    for (const p of all.body.data) {
      if (p.website) expect(p.website).toMatch(/^https:/);
      expect(p.category).toBeTruthy();
    }

    const first = all.body.data[0];
    const firstCap =
      first.capability_list?.find((c: unknown) => typeof c === 'object' && c !== null && 'capability' in c) ??
      null;
    if (firstCap) {
      const token = String((firstCap as { capability: string }).capability).split(' ').slice(0, 2).join(' ');
      const filtered = await request(app).get(`/api/providers?capability=${encodeURIComponent(token)}`);
      expect(filtered.status).toBe(200);
      const hit = filtered.body.data.find((p: { id: string }) => p.id === first.id);
      expect(hit).toBeTruthy();
    }
  });
});

describe('Usage instrumentation (PRD §3.5)', () => {
  it('accepts catalog events, stores hashed keys only, aggregates summary', async () => {
    const rawKey = `events${Math.floor(Math.random() * 1e9).toString(36)}abcdef12`;
    const expectedHash = createHash('sha256').update(rawKey).digest('hex').slice(0, 24);

    const post = await request(app)
      .post('/api/events')
      .set('X-Session-Key', rawKey)
      .send({ name: 'compare_create', properties: { city_count: '2' } });
    expect(post.status).toBe(202);
    expect(post.body.accepted).toBe(true);

    await request(app).post('/api/events').set('X-Session-Key', rawKey).send({ name: 'search' });

    const summary = await request(app).get('/api/events/summary');
    expect(summary.status).toBe(200);
    expect(summary.body.total_events).toBeGreaterThanOrEqual(2);
    expect(summary.body.events_by_name.compare_create).toBeGreaterThanOrEqual(1);
    expect(summary.body.events_by_name.search).toBeGreaterThanOrEqual(1);

    // Raw keys must never be stored; only the truncatured hash
    const { getDatabase } = await import('../src/db/database');
    const db = await getDatabase();
    const stored = (await db.all('SELECT session_hash FROM events')) as unknown as { session_hash: string | null }[];
    expect(stored.some((r) => r.session_hash === expectedHash)).toBe(true);
    expect(stored.some((r) => typeof r.session_hash === 'string' && r.session_hash.includes(rawKey))).toBe(false);
  });
});
