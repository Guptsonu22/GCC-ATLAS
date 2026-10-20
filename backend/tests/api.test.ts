/* eslint-disable no-console */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/index';
import { closeDatabase } from '../src/db/database';
import type { Express } from 'express';

let app: Express;
let goldKey: string;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  process.env.NODE_ENV = 'test';
  app = await createApp();
});

describe('API integration', () => {
  it('health endpoint responds with DB and mode fields', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('ok');
    expect(['demo', 'llm']).toContain(res.body.mode);
    expect(typeof res.body.uptime_seconds).toBe('number');
  });

  it('dashboard stats include counting note', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.counting_note).toMatch(/tracked dataset/i);
    expect(res.body.total_companies).toBeGreaterThan(30);
  });

  it('companies list, filter, paginate and 404 handling', async () => {
    const list = await request(app).get('/api/companies?page=1&page_size=5');
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(5);
    expect(list.body.total).toBeGreaterThan(30);

    const filtered = await request(app).get('/api/companies?location_id=loc_bengaluru&page_size=100');
    expect(filtered.status).toBe(200);
    expect(filtered.body.total).toBeGreaterThan(10);

    const bad = await request(app).get('/api/companies/does-not-exist');
    expect(bad.status).toBe(404);
    expect(bad.body.error.code).toBe('not_found');
  });

  it('rejects invalid filters with 400', async () => {
    const res = await request(app).get('/api/companies?page=notanumber');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('city comparison endpoint works with multiple cities', async () => {
    const res = await request(app).get('/api/cities/compare?ids=loc_bengaluru,loc_hyderabad,loc_pune');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  it('city comparison with unknown ids is a 400, never a silently-truncated table', async () => {
    const res = await request(app).get('/api/cities/compare?ids=loc_bengaluru,loc_NOSUCH');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details.resolved).toEqual(['loc_bengaluru']);
    const onlyOne = await request(app).get('/api/cities/compare?ids=loc_NOSUCH1,loc_NOSUCH2');
    expect(onlyOne.status).toBe(400);
  });

  it('assistant status reports demo mode without key', async () => {
    const res = await request(app).get('/api/assistant/status');
    expect(res.status).toBe(200);
    expect(res.body.ai_configured).toBe(false);
    expect(res.body.mode).toBe('deterministic-demo');
  });

  it('assistant query returns structured demo answer with citations', async () => {
    const res = await request(app).post('/api/assistant/query').send({ query: 'Compare Bengaluru and Hyderabad office costs' });
    expect(res.status).toBe(200);
    expect(res.body.is_demo_mode).toBe(true);
    expect(res.body.mode).toBe('demo');
    expect(typeof res.body.answer.direct_answer).toBe('string');
    expect(res.body.answer.key_findings).toBeInstanceOf(Array);
    expect(res.body.citations).toBeInstanceOf(Array);
    expect(res.body.retrieval.matched.cities).toBeGreaterThanOrEqual(2);
  });

  it('assistant rejects short queries', async () => {
    const res = await request(app).post('/api/assistant/query').send({ query: 'hi' });
    expect(res.status).toBe(400);
  });

  it('saved research requires an X-Session-Key and scopes records to it', async () => {
    const denied = await request(app)
      .post('/api/saved-research')
      .send({ name: 'No key', type: 'city_comparison', data: {} });
    expect(denied.status).toBe(400);

    goldKey = 'integration-session-gold';
    const create = await request(app)
      .post('/api/saved-research')
      .set('X-Session-Key', goldKey)
      .send({ name: 'My comparison', type: 'city_comparison', data: { ids: ['loc_bengaluru', 'loc_pune'] } });
    expect(create.status).toBe(201);
    const id = create.body.id;

    // Same session sees it
    const list = await request(app).get('/api/saved-research').set('X-Session-Key', goldKey);
    expect(list.status).toBe(200);
    expect(list.body.data.some((x: { id: string }) => x.id === id)).toBe(true);

    // A different session does NOT see it (isolation invariant)
    const otherList = await request(app).get('/api/saved-research').set('X-Session-Key', 'integration-session-other');
    expect(otherList.status).toBe(200);
    expect(otherList.body.data.some((x: { id: string }) => x.id === id)).toBe(false);

    // Cross-session attempts to mutate or fetch it are 404
    const otherGet = await request(app).get(`/api/saved-research/${id}`).set('X-Session-Key', 'integration-session-other');
    expect(otherGet.status).toBe(404);

    const update = await request(app).patch(`/api/saved-research/${id}`).set('X-Session-Key', goldKey).send({ name: 'Renamed' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Renamed');

    const del = await request(app).delete(`/api/saved-research/${id}`).set('X-Session-Key', goldKey);
    expect(del.status).toBe(204);
  });

  it('rejects weak or malformed X-Session-Key values', async () => {
    const res = await request(app).get('/api/saved-research').set('X-Session-Key', 'short');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');

    const res2 = await request(app).get('/api/saved-research').set('X-Session-Key', 'has spaces in it');
    expect(res2.status).toBe(400);
  });

  it('saved comparisons CRUD with session isolation', async () => {
    const create = await request(app)
      .post('/api/saved-comparisons')
      .set('X-Session-Key', 'comparisons-session-1')
      .send({
        name: 'Hub shortlist',
        location_ids: ['loc_bengaluru', 'loc_hyderabad'],
        metric_names: ['gcc_count'],
      });
    expect(create.status).toBe(201);
    expect(JSON.parse(create.body.location_ids)).toHaveLength(2);
    const id = create.body.id;

    const list = await request(app).get('/api/saved-comparisons').set('X-Session-Key', 'comparisons-session-1');
    expect(list.status).toBe(200);
    expect(list.body.data.some((x: { id: string }) => x.id === id)).toBe(true);

    const otherList = await request(app).get('/api/saved-comparisons').set('X-Session-Key', 'comparisons-session-2');
    expect(otherList.body.data.some((x: { id: string }) => x.id === id)).toBe(false);

    // Phase 8 QA: session keys must never leak back in response bodies
    expect(create.body.session_key).toBeUndefined();
    expect(list.body.data.every((x: { session_key?: string }) => x.session_key === undefined)).toBe(true);
    const savedList = await request(app).get('/api/saved-research').set('X-Session-Key', 'integration-session-gold');
    expect(savedList.body.data.every((x: { session_key?: string }) => x.session_key === undefined)).toBe(true);

    // Phase 8 QA: oversized saved-data payloads are rejected before they hit the DB
    const huge = await request(app)
      .post('/api/saved-research')
      .set('X-Session-Key', 'integration-session-gold')
      .send({ name: 'Huge blob', type: 'custom_query', data: { blob: 'x'.repeat(25_000) } });
    expect(huge.status).toBe(400);
    expect(huge.body.error.code).toBe('validation_error');

    const needsTwo = await request(app)
      .post('/api/saved-comparisons')
      .set('X-Session-Key', 'comparisons-session-1')
      .send({ name: 'Only one city', location_ids: ['loc_bengaluru'] });
    expect(needsTwo.status).toBe(400);

    const del = await request(app).delete(`/api/saved-comparisons/${id}`).set('X-Session-Key', 'comparisons-session-1');
    expect(del.status).toBe(204);
  });

  it('404 for unknown routes with JSON error', async () => {
    const res = await request(app).get('/api/nonsense');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('source-records and announcements endpoints respond', async () => {
    const sources = await request(app).get('/api/source-records?verification_status=unverified&page_size=5');
    expect(sources.status).toBe(200);
    expect(sources.body.data.length).toBeGreaterThan(0);

    const highConfidence = await request(app).get('/api/source-records?confidence_level=high&page_size=5');
    expect(highConfidence.status).toBe(200);
    expect(highConfidence.body.data.every((s: { confidence_level: string }) => s.confidence_level === 'high')).toBe(true);

    // Legacy path is gone (renamed to source-records)
    const legacy = await request(app).get('/api/sources');
    expect(legacy.status).toBe(404);

    const announcements = await request(app).get('/api/announcements?page_size=10');
    expect(announcements.status).toBe(200);
    expect(announcements.body.total).toBeGreaterThan(5);
  });

  it('source-records detail exposes reverse usage for the evidence explorer', async () => {
    const cited = await request(app).get('/api/source-records/src_tn_gov');
    expect(cited.status).toBe(200);
    expect(cited.body.source.id).toBe('src_tn_gov');
    expect(cited.body.usage.policies.some((p: { id: string }) => p.id === 'pol_tamilnadu')).toBe(true);
    expect(cited.body.usage.announcements.length).toBeGreaterThan(0);

    const unknown = await request(app).get('/api/source-records/src_missing');
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('not_found');
  });

  it('dashboard stats include record-level verification buckets', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    const v = res.body.companies_verification;
    expect(v.total).toBe(res.body.total_companies);
    expect(v.verified + v.awaiting_verification + v.stale + v.conflicting).toBe(v.total);
    expect(res.body.policies_verification.awaiting_verification).toBeGreaterThanOrEqual(2);
    expect(res.body.verification_definitions).toMatch(/365/);
  });

  it('policies endpoint returns status-linked records with filters', async () => {
    const all = await request(app).get('/api/policies');
    expect(all.status).toBe(200);
    expect(all.body.data.length).toBeGreaterThan(4);
    const statuses = new Set<string>(all.body.data.map((p: { status: string }) => p.status));
    expect(statuses.has('finalized')).toBe(true);
    expect(statuses.has('draft')).toBe(true);

    const gujarat = await request(app).get('/api/policies?state=Gujarat');
    expect(gujarat.status).toBe(200);
    expect(gujarat.body.data.some((p: { status: string }) => p.status === 'finalized')).toBe(true);
    expect(gujarat.body.data.every((p: { normalized_benefits: string | null }) => typeof p.normalized_benefits === 'string')).toBe(true);
  });

  it('providers filter by category', async () => {
    const res = await request(app).get('/api/providers?category=eor');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });
});

afterAll(async () => {
  await closeDatabase();
});