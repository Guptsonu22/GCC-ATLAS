import { execFile, spawn } from 'node:child_process';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import axios from 'axios';
import { z } from 'zod';

import {
  companySchema,
  healthSchema,
  locationSchema,
  policyRecordSchema,
  providerSchema,
  sourceSchema,
  savedComparisonSchema,
} from '../src/services/schemas';

const here = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(here, '../../backend');

const PORT = 4791;
const BASE = `http://localhost:${PORT}/api`;

let child: ReturnType<typeof spawn> | null = null;
let workDir: string;
let dbPath: string;

function runNode(script: string, env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [script],
      { env, cwd: BACKEND, timeout: 30_000 },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

beforeAll(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), 'gcc-atlas-api-'));
  dbPath = path.join(workDir, 'smoke.db');
  const env = { ...process.env, PORT: String(PORT), DB_PATH: dbPath, NODE_ENV: 'test' };

  // Seed idempotently from the CLI build first to avoid SQLite concurrency lock race:
  await runNode(path.join(BACKEND, 'dist', 'db', 'seed.js'), env);

  child = spawn(process.execPath, [path.join(BACKEND, 'dist', 'index.js')], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.on('error', (e) => {
    throw e;
  });

  // Wait for the server to accept requests.
  const deadline = Date.now() + 15_000;
  let up = false;
  while (Date.now() < deadline) {
    try {
      await axios.get(`${BASE}/health`, { timeout: 500 });
      up = true;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  if (!up) throw new Error('Backend smoke server did not come up in time');
}, 45_000);

afterAll(async () => {
  child?.kill();
  await rm(workDir, { recursive: true, force: true });
});

describe('live backend smoke (real API, frontend schemas)', () => {
  it('health envelope parses and reports ok database', async () => {
    const { data } = await axios.get(`${BASE}/health`);
    const health = healthSchema.parse(data);
    expect(health.database).toBe('ok');
    expect(health.version).toBe('0.1.0');
  });

  it('GET /cities returns schema-valid locations with tracked counts', async () => {
    const { data } = await axios.get(`${BASE}/cities`);
    const cities = z.object({ data: z.array(locationSchema) }).parse(data).data;
    expect(cities.length).toBeGreaterThan(0);
    const bengaluru = cities.find((c) => c.name === 'Bengaluru');
    expect(bengaluru).toBeDefined();
    expect(bengaluru!.tracked_company_count ?? 0).toBeGreaterThan(0);
  });

  it('GET /policies returns policy records with defined status', async () => {
    const { data } = await axios.get(`${BASE}/policies`);
    const policies = z.object({ data: z.array(policyRecordSchema) }).parse(data).data;
    expect(policies.length).toBeGreaterThan(0);
    for (const p of policies) expect(['draft', 'finalized', 'announced', 'superseded']).toContain(p.status);
    const finalized = policies.filter((p) => p.status === 'finalized');
    expect(finalized.length).toBeGreaterThan(0);
  });

  it('GET /source-records is the canonical endpoint with confidence levels', async () => {
    const { data } = await axios.get(`${BASE}/source-records`);
    const sources = z.object({ data: z.array(sourceSchema) }).parse(data).data;
    expect(sources.length).toBeGreaterThan(0);
    for (const s of sources) expect(['high', 'medium', 'low']).toContain(s.confidence_level);
    // Legacy path must be gone.
    await expect(axios.get(`${BASE}/sources`)).rejects.toMatchObject({ response: { status: 404 } });
  });

  it('GET /companies/:id detail parses with company envelope', async () => {
    const { data } = await axios.get(`${BASE}/companies`);
    const companies = z.object({ data: z.array(z.object({ id: z.string() })) }).parse(data).data;
    expect(companies.length).toBeGreaterThan(0);
    const first = companies[0]!.id;
    const detailRes = await axios.get(`${BASE}/companies/${first}`);
    // /companies/:id returns the raw company row; pages wrap it as { company: row }.
    const company = companySchema.parse(detailRes.data);
    expect(company.id).toBe(first);
  });

  it('GET /providers exposes capability_list arrays from the live API', async () => {
    const { data } = await axios.get(`${BASE}/providers`);
    const parsed = z.object({ data: z.array(providerSchema) }).parse(data).data;
    expect(parsed.length).toBeGreaterThan(0);
    const withCaps = parsed.find((p) => (p.capability_list ?? []).length > 0);
    if (withCaps) {
      const cap = withCaps.capability_list![0]!;
      expect(cap).toHaveProperty('capability');
    }
  });

  it('seed data file integrity: provenance fields present in source', async () => {
    const raw = await readFile(path.join(BACKEND, 'src', 'data', 'seed-data.ts'), 'utf8');
    expect(raw).toContain('company_id:');
    expect(raw.toLowerCase()).not.toContain('todo');
  });

  describe('saved items need a session key and persist per session', () => {
    const session = `smoke_${Date.now()}_x`;
    const headers = { 'x-session-key': session };

    it('rejects missing session key', async () => {
      await expect(
        axios.post(`${BASE}/saved-research`, { name: 'no session', type: 'custom_query', data: {} }),
      ).rejects.toMatchObject({ response: { status: 400 } });
    });

    it('saved comparison roundtrip on the seeded dataset', async () => {
      const { data: citiesRes } = await axios.get(`${BASE}/cities`);
      const ids = z.object({ data: z.array(locationSchema) }).parse(citiesRes).data.slice(0, 2).map((c) => c.id);
      expect(ids.length).toBe(2);

      const created = await axios.post(`${BASE}/saved-comparisons`, { name: 'smoke test', location_ids: ids }, { headers });
      const saved = savedComparisonSchema.parse(created.data);
      // Storage contract: location_ids is a JSON-encoded string column; pages decode it.
      expect(typeof saved.location_ids).toBe('string');
      expect(JSON.parse(saved.location_ids)).toEqual(ids);

      const list = await axios.get(`${BASE}/saved-comparisons`, { headers });
      expect(z.object({ data: z.array(savedComparisonSchema) }).parse(list.data).data.some((x) => x.id === saved.id)).toBe(true);

      // a different session must not see it
      await expect(
        axios.get(`${BASE}/saved-comparisons/${saved.id}`, { headers: { 'x-session-key': `${session}_other` } }),
      ).rejects.toMatchObject({ response: { status: 404 } });

      await axios.delete(`${BASE}/saved-comparisons/${saved.id}`, { headers });
      await expect(axios.get(`${BASE}/saved-comparisons/${saved.id}`, { headers })).rejects.toMatchObject({ response: { status: 404 } });
    });
  });
});
