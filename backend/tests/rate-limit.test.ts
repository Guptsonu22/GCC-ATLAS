/* eslint-disable no-console */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Express } from 'express';

/**
 * Rate limiting (Phase 6, API reliability): verifies the expensive-analysis
 * limiter engages 429s with the project error envelope. Env vars are set
 * BEFORE app import; NODE_ENV is deliberately NOT 'test' so limiters mount.
 */

let app: Express;

beforeAll(async () => {
  vi.resetModules();
  process.env.NODE_ENV = 'production';
  process.env.DB_PATH = ':memory:';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_ANALYSIS_MAX = '2';
  const { createApp } = await import('../src/index');
  app = await createApp();
});

afterAll(async () => {
  const { closeDatabase } = await import('../src/db/database');
  await closeDatabase();
});

describe('analysis-tier rate limit', () => {
  it('returns 429 with error envelope once the budget is spent', async () => {
    expect((await request(app).get('/api/assistant/status')).status).toBe(200);
    expect((await request(app).get('/api/assistant/status')).status).toBe(200);
    const third = await request(app).get('/api/assistant/status');
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('rate_limited');
  });
});
