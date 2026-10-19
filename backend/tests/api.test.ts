/* eslint-disable no-console */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/index';
import { closeDatabase } from '../src/db/database';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
  process.env.DB_PATH = ':memory:';
  app = await createApp();
});

describe('API integration', () => {
  it('health endpoint responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
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

  it('assistant status reports demo mode without key', async () => {
    const res = await request(app).get('/api/assistant/status');
    expect(res.status).toBe(200);
    expect(res.body.ai_configured).toBe(false);
    expect(res.body.mode).toBe('deterministic-demo');
  });

  it('assistant query returns demo answer with citations', async () => {
    const res = await request(app).post('/api/assistant/query').send({ query: 'Compare Bengaluru and Hyderabad office costs' });
    expect(res.status).toBe(200);
    expect(res.body.is_demo_mode).toBe(true);
    expect(res.body.citations).toBeInstanceOf(Array);
  });

  it('assistant rejects short queries', async () => {
    const res = await request(app).post('/api/assistant/query').send({ query: 'hi' });
    expect(res.status).toBe(400);
  });

  it('saved research full CRUD cycle over HTTP', async () => {
    const create = await request(app)
      .post('/api/saved-research')
      .send({ name: 'My comparison', type: 'city_comparison', data: { ids: ['loc_bengaluru', 'loc_pune'] } });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const list = await request(app).get('/api/saved-research');
    expect(list.status).toBe(200);
    expect(list.body.data.some((x: { id: string }) => x.id === id)).toBe(true);

    const update = await request(app).patch(`/api/saved-research/${id}`).send({ name: 'Renamed' });
    expect(update.status).toBe(200);
    expect(update.body.name).toBe('Renamed');

    const del = await request(app).delete(`/api/saved-research/${id}`);
    expect(del.status).toBe(204);
  });

  it('404 for unknown routes with JSON error', async () => {
    const res = await request(app).get('/api/nonsense');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('sources and announcements endpoints respond', async () => {
    const sources = await request(app).get('/api/sources?verification_status=unverified&page_size=5');
    expect(sources.status).toBe(200);
    expect(sources.body.data.length).toBeGreaterThan(0);

    const announcements = await request(app).get('/api/announcements?page_size=10');
    expect(announcements.status).toBe(200);
    expect(announcements.body.total).toBeGreaterThan(5);
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