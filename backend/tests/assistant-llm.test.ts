/* eslint-disable no-console */
import request from 'supertest';
import http from 'node:http';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Express } from 'express';

/**
 * Phase 7 — LLM-mode assistant behaviour tested against a MOCK OpenAI-compatible
 * provider, so no external service is required. Cases: valid structured answer,
 * hallucinated citation stripping, provider 500, provider timeout, malformed
 * JSON, and citationless answers. NODE_ENV stays 'test' (rate limiters off) but
 * AI_API_KEY is set so the LLM path engages.
 */

let app: Express;
let server: http.Server;
let port: number;
let behavior: 'ok' | 'error500' | 'hang' | 'malformed' = 'ok';

function okJson(): string {
  return JSON.stringify({
    direct_answer: 'Both cities carry the same tracked indicative rent estimate; other metrics differ.',
    key_findings: ['Hyderabad and Pune rent metrics both cite the brokerage estimate source.'],
    comparison_table: {
      caption: 'Hyderabad vs Pune',
      columns: ['Hyderabad', 'Pune'],
      rows: [{ label: 'Grade-A office rent', values: ['75 INR/sqft/month (est.)', '75 INR/sqft/month (est.)'] }],
    },
    evidence_facts: [
      { statement: 'Hyderabad rent figure', source_ids: ['src_cbre'] },
      { statement: 'Pune rent figure', source_ids: ['src_cbre'] },
      { statement: 'Invented fact, source unknown to the pack', source_ids: ['src_fake_hallucination', 'src_cbre'] },
    ],
    recommendations: [
      { text: 'Conditional: Hyderabad first if talent depth outweighs rent.', basis: 'Model recommendation — verify before acting.' },
    ],
    assumptions: ['All metrics are indicative estimates.'],
    missing_information: ['Decision criteria like function and headcount were not provided.'],
    next_step: 'Request updated primary reports for both cities.',
  });
}

beforeAll(async () => {
  vi.resetModules();

  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
    });
    req.on('end', () => {
      if (behavior === 'error500') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'mock provider down' } }));
        return;
      }
      if (behavior === 'hang') return; // no response → client-side timeout
      if (behavior === 'malformed') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { content: 'Sorry, I declined your JSON contract. Here is prose instead.' } }] }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: okJson() } }] }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as { port: number }).port;

  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = ':memory:';
  process.env.AI_API_KEY = 'mock-key';
  process.env.AI_BASE_URL = `http://127.0.0.1:${port}/v1`;
  process.env.AI_TIMEOUT_MS = '800';
  delete process.env.RATE_LIMIT_WINDOW_MS;

  const { createApp } = await import('../src/index');
  app = await createApp();
});

afterAll(async () => {
  const { closeDatabase } = await import('../src/db/database');
  await closeDatabase();
  server.close();
});

describe('LLM-mode assistant (mock provider)', () => {
  it('returns a structured answer; hallucinated citation ids are stripped', async () => {
    behavior = 'ok';
    const res = await request(app).post('/api/assistant/query').send({ query: 'Compare Hyderabad and Pune office costs' });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('llm');
    expect(res.body.is_demo_mode).toBe(false);
    expect(res.body.answer.direct_answer).toBeTruthy();
    expect(res.body.answer.comparison_table.rows[0].values).toHaveLength(2);

    // citation-id validation against the retrieved pack
    const ids = res.body.citations.map((c: { source_id: string }) => c.source_id);
    expect(ids).toContain('src_cbre');
    expect(ids).not.toContain('src_fake_hallucination');
    const fact = res.body.answer.evidence_facts.find(
      (f: { statement: string }) => /Invented fact/.test(f.statement),
    );
    expect(fact.source_ids).toEqual(['src_cbre']); // unknown id stripped, valid kept

    for (const c of res.body.citations) expect(c.verification_status).toBeTruthy();
  });

  it('provider 500 → 502 envelope with retryable flag, NO silent fallback', async () => {
    behavior = 'error500';
    const res = await request(app).post('/api/assistant/query').send({ query: 'Compare Hyderabad and Pune office costs' });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('assistant_provider_error');
    expect(res.body.error.retryable).toBe(true);
    expect(res.body.error.message).toMatch(/provider error 500/);
    behavior = 'ok';
  });

  it('provider timeout → 504 envelope, NO invented output', async () => {
    behavior = 'hang';
    const res = await request(app).post('/api/assistant/query').send({ query: 'Compare Hyderabad and Pune office costs' });
    expect([504, 502]).toContain(res.status);
    expect(res.body.error.code).toBe('assistant_provider_error');
    behavior = 'ok';
  });

  it('malformed (non-JSON) model output → 502, never rendered as an answer', async () => {
    behavior = 'malformed';
    const res = await request(app).post('/api/assistant/query').send({ query: 'Compare Hyderabad and Pune office costs' });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('assistant_provider_error');
    expect(res.body.error.message).toMatch(/JSON/i);
    behavior = 'ok';
  });

  it('invalid request bodies are still rejected before retrieval', async () => {
    const res = await request(app).post('/api/assistant/query').send({ query: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('demo mode can be forced even with a key configured', async () => {
    behavior = 'error500'; // would fail if the LLM path were taken
    const res = await request(app)
      .post('/api/assistant/query')
      .send({ query: 'Compare Hyderabad and Pune office costs', use_demo_mode: true });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('demo');
    expect(res.body.is_demo_mode).toBe(true);
    behavior = 'ok';
  });
});
