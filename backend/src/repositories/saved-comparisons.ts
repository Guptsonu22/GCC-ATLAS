import type { Database } from 'sqlite';
import { newId } from '../db/database';
import type { SavedComparison, SavedComparisonInput } from '../types';

/**
 * Saved city comparisons, scoped to an anonymous X-Session-Key exactly like
 * saved_research (see repositories/saved-research.ts for rationale).
 */
export function createSavedComparisonsRepo(db: Database) {
  async function listComparisons(sessionKey: string): Promise<SavedComparison[]> {
    return db.all('SELECT * FROM saved_comparisons WHERE session_key = ? ORDER BY updated_at DESC', [sessionKey]);
  }

  async function getComparison(id: string, sessionKey: string): Promise<SavedComparison | undefined> {
    return db.get('SELECT * FROM saved_comparisons WHERE id = ? AND session_key = ?', [id, sessionKey]);
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
