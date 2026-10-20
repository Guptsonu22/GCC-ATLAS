import type { Database } from 'sqlite';
import { newId } from '../db/database';

/**
 * Ownership strategy: every saved record is scoped to an anonymous session key
 * supplied by the client (X-Session-Key header). Reads AND writes are filtered
 * by session_key, so records created in one browser are never exposed to
 * another. There is no fixed-user fallback: an absent or invalid key is a 400.
 */
export function createSavedResearchRepo(db: Database) {
  /** Never send the scoping key (or any user id) back in response bodies. */
  function sanitize<T extends Record<string, unknown>>(row: T | undefined) {
    if (!row) return row;
    const { session_key: _k, user_id: _u, ...rest } = row;
    void _k;
    void _u;
    return rest as T;
  }

  async function listSaved(sessionKey: string) {
    const rows = (await db.all('SELECT * FROM saved_research WHERE session_key = ? ORDER BY updated_at DESC', [sessionKey])) as unknown as Record<string, unknown>[];
    return rows.map((r) => sanitize(r));
  }

  async function getSaved(id: string, sessionKey: string) {
    const row = (await db.get('SELECT * FROM saved_research WHERE id = ? AND session_key = ?', [id, sessionKey])) as Record<string, unknown> | undefined;
    return sanitize(row);
  }

  async function createSaved(input: { session_key: string; user_id?: string | null; name: string; type: string; data: unknown }) {
    const id = newId('sr');
    await db.run(
      `INSERT INTO saved_research (id, session_key, user_id, name, type, data) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.session_key, input.user_id ?? null, input.name, input.type, JSON.stringify(input.data)],
    );
    return getSaved(id, input.session_key);
  }

  async function updateSaved(id: string, sessionKey: string, input: { name?: string; data?: unknown }) {
    const existing = await getSaved(id, sessionKey);
    if (!existing) return null;
    const name = input.name ?? (existing.name as string);
    const data = input.data !== undefined ? JSON.stringify(input.data) : (existing.data as string);
    await db.run(`UPDATE saved_research SET name = ?, data = ?, updated_at = datetime('now') WHERE id = ? AND session_key = ?`, [name, data, id, sessionKey]);
    return getSaved(id, sessionKey);
  }

  async function deleteSaved(id: string, sessionKey: string): Promise<boolean> {
    const result = await db.run('DELETE FROM saved_research WHERE id = ? AND session_key = ?', [id, sessionKey]);
    return (result.changes ?? 0) > 0;
  }

  return { listSaved, getSaved, createSaved, updateSaved, deleteSaved };
}

export type SavedResearchRepo = ReturnType<typeof createSavedResearchRepo>;
