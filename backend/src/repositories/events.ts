import { createHash } from 'node:crypto';
import type { Database } from 'sqlite';

export const EVENT_NAMES = [
  'search',
  'detail_view',
  'compare_create',
  'compare_reopen',
  'source_click',
  'export',
  'saved_create',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const SESSION_HASH_LENGTH = 24;

/** Pseudonymous, non-reversible derivative of the session key (hash, truncated). */
export function hashSessionKey(sessionKey: string | string[] | undefined): string | null {
  if (!sessionKey || typeof sessionKey !== 'string') return null;
  return createHash('sha256').update(sessionKey).digest('hex').slice(0, SESSION_HASH_LENGTH);
}

export function createEventsRepo(db: Database) {
  async function record(
    name: EventName,
    properties: Record<string, unknown>,
    sessionKey: string | string[] | undefined,
  ): Promise<void> {
    const propsStr = Object.keys(properties).length ? JSON.stringify(properties) : null;
    await db.run('INSERT INTO events (name, session_hash, properties) VALUES (?, ?, ?)', [
      name,
      hashSessionKey(sessionKey),
      propsStr,
    ]);
  }

  async function summary(): Promise<{
    total_events: number;
    window_days: number;
    events_by_name: Record<string, number>;
    events_by_name_last_7_days: Record<string, number>;
    distinct_session_hashes: number;
  }> {
    const totalRow = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM events');
    const byName = (await db.all('SELECT name, COUNT(*) AS n FROM events GROUP BY name')) as { name: string; n: number }[];
    const byNameRecent = (await db.all(
      "SELECT name, COUNT(*) AS n FROM events WHERE created_at >= datetime('now', '-7 days') GROUP BY name",
    )) as { name: string; n: number }[];
    const distinct = await db.get<{ n: number }>('SELECT COUNT(DISTINCT session_hash) AS n FROM events WHERE session_hash IS NOT NULL');

    const pack = (rows: { name: string; n: number }[]): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const n of EVENT_NAMES) out[n] = 0;
      for (const r of rows) out[r.name] = r.n;
      return out;
    };
    return {
      total_events: totalRow?.n ?? 0,
      window_days: 7,
      events_by_name: pack(byName),
      events_by_name_last_7_days: pack(byNameRecent),
      distinct_session_hashes: distinct?.n ?? 0,
    };
  }

  return { record, summary };
}
