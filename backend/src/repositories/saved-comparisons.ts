import type { Database } from 'sqlite';
import { newId } from '../db/database';
import type { SavedComparison, SavedComparisonInput } from '../types';

/**
 * Saved city comparisons, scoped to an anonymous X-Session-Key exactly like
 * saved_research (see repositories/saved-research.ts for rationale).
 */
export function createSavedComparisonsRepo(db: Database) {
  /** Never send the scoping key back in response bodies. */
  function sanitize(row: Record<string, unknown> | undefined): SavedComparison | undefined {
    if (!row) return undefined;
    const { session_key: _k, ...rest } = row;
    void _k;
    return rest as unknown as SavedComparison;
  }

  async function listComparisons(sessionKey: string): Promise<SavedComparison[]> {
    const rows = (await db.all('SELECT * FROM saved_comparisons WHERE session_key = ? ORDER BY updated_at DESC', [sessionKey])) as unknown as Record<string, unknown>[];
    return rows.map((r) => sanitize(r) as SavedComparison);
  }

  async function getComparison(id: string, sessionKey: string): Promise<SavedComparison | undefined> {
    const row = (await db.get('SELECT * FROM saved_comparisons WHERE id = ? AND session_key = ?', [id, sessionKey])) as Record<string, unknown> | undefined;
    return sanitize(row);
  }

  async function createComparison(sessionKey: string, input: SavedComparisonInput): Promise<SavedComparison | undefined> {
    const id = newId('sc');
    await db.run(
      'INSERT INTO saved_comparisons (id, session_key, name, type, location_ids, metric_names, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        sessionKey,
        input.name,
        'city_comparison',
        JSON.stringify(input.location_ids),
        input.metric_names ? JSON.stringify(input.metric_names) : null,
        input.notes ?? null,
      ],
    );
    return getComparison(id, sessionKey);
  }

  async function deleteComparison(id: string, sessionKey: string): Promise<boolean> {
    const result = await db.run('DELETE FROM saved_comparisons WHERE id = ? AND session_key = ?', [id, sessionKey]);
    return (result.changes ?? 0) > 0;
  }

  async function renameComparison(id: string, sessionKey: string, name: string): Promise<boolean> {
    const result = await db.run(
      "UPDATE saved_comparisons SET name = ?, updated_at = datetime('now') WHERE id = ? AND session_key = ?",
      [name, id, sessionKey],
    );
    return (result.changes ?? 0) > 0;
  }

  return { listComparisons, getComparison, createComparison, deleteComparison, renameComparison };
}

export type SavedComparisonsRepo = ReturnType<typeof createSavedComparisonsRepo>;
