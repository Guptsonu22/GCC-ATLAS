import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDatabase, initializeSchema, closeDatabase } from '../src/db/database';
import { importDataset } from '../src/db/seed';
import { createAssistantService } from '../src/services/assistant/service';
import type { Database } from 'sqlite';

let db: Database;

beforeAll(async () => {
  delete process.env.AI_API_KEY; // force deterministic demo mode
  db = await getDatabase();
  await initializeSchema(db);
  await importDataset(db, { reset: true });
});

describe('assistant (deterministic demo mode, Phase 7 structured contract)', () => {
  it('city comparison: direct answer + table + facts + citations, missing values stay null', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Compare Bengaluru and Hyderabad office costs' });

    expect(response.mode).toBe('demo');
    expect(response.is_demo_mode).toBe(true);
    expect(response.insufficient_evidence).toBe(false);
    expect(response.answer.direct_answer).toMatch(/Comparing|estimates/i);
    expect(response.answer.comparison_table).not.toBeNull();
    const table = response.answer.comparison_table!;
    expect(table.columns).toContain('Bengaluru');
    expect(table.columns).toContain('Hyderabad');
    for (const row of table.rows) {
      expect(row.values.length).toBe(table.columns.length);
      for (const v of row.values) expect(v).not.toMatch(/^(?:0)$/); // never silently zero
    }
    expect(response.answer.evidence_facts.length).toBeGreaterThan(0);
    for (const f of response.answer.evidence_facts) expect(f.source_ids.length).toBeGreaterThan(0);
    for (const citation of response.citations) {
      expect(citation.url).toMatch(/^https?:\/\//);
      expect(citation.verification_status).toBeTruthy();
    }
    expect(response.retrieval.matched.cities).toBeGreaterThanOrEqual(2);
    expect(response.retrieval.evidence_sources).toBeGreaterThan(0);
  });

  it('citation ids map to real source records', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Compare Pune and Mumbai' });
    const cited = response.citations.map((c) => c.source_id);
    const rows = (await db.all(`SELECT id FROM source_records WHERE id IN (${cited.map(() => '?').join(',')})`, cited)) as unknown as unknown[];
    expect(rows.length).toBe(cited.length);
  });

  it('single city answer includes tracked counts and estimate markers', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Tell me about Chennai GCC talent availability' });
    expect(response.answer.direct_answer).toMatch(/Chennai/);
    expect(response.insufficient_evidence).toBe(false);
    expect(response.answer.key_findings.join('\n')).toMatch(/estimate|Not available/i);
  });

  it('company queries answer from the tracked set', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Tell me about Microsoft India operations' });
    expect(response.answer.direct_answer).toMatch(/tracked companies/i);
    expect(response.answer.key_findings.join(' ')).toMatch(/Microsoft India/);
    expect(response.answer.key_findings.join(' ')).toMatch(/active|expanding/);
  });

  it('policy queries include status and verification caveats', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'What is the Karnataka GCC policy?' });
    expect(response.answer.key_findings.join(' ')).toMatch(/Karnataka/i);
    expect(response.answer.assumptions.join(' ')).toMatch(/verif/i);
  });

  it('recent-announcements journey applies a time window', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Which tracked GCCs announced expansion activity recently?' });
    expect(response.retrieval.time_window_days).toBe(90);
    expect(response.insufficient_evidence).toBe(false);
    expect(response.answer.direct_answer).toMatch(/announcements/i);
  });

  it('provider queries answer with verification framing, no fabric case studies', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Which providers have documented experience with GCC setup?' });
    expect(response.answer.direct_answer).toMatch(/providers/i);
    expect(response.answer.missing_information.join(' ')).toMatch(/case studies/i);
  });

  it('unknown topic → honest insufficiency, low confidence, never invented', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'What is the quarterly revenue of widget manufacturing in Peru?' });
    expect(response.insufficient_evidence).toBe(true);
    expect(response.mode).toBe('demo');
    expect(response.confidence).toBe('low');
    expect(response.citations).toHaveLength(0);
    expect(response.answer.direct_answer).toMatch(/sufficient evidence/i);
  });

  it('control characters in the question are sanitized away', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Compare Bengaluru\u0000 and Hyderabad\u0013 office costs' });
    expect(response.answer.direct_answer.length).toBeGreaterThan(0);
    expect(response.answer.direct_answer).not.toMatch(/[\u0000-\u001f]/);
  });

  it('the compute answer path flags recommendations as rule-based (not model output)', async () => {
    const service = createAssistantService(db);
    const response = await service.answer({ query: 'Compare Hyderabad and Pune for an engineering GCC' });
    if (response.answer.recommendations.length) {
      expect(response.answer.recommendations[0]!.basis).toMatch(/rule-based/i);
    }
  });
});

afterAll(async () => {
  await closeDatabase();
});
