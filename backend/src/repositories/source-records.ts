import type { Database } from 'sqlite';
import type { SourceRecord } from '../types';

export function createSourceRecordsRepo(db: Database) {
  async function listSourceRecords(opts: {
    query?: string;
    source_type?: string;
    verification_status?: string;
    confidence_level?: string;
    page?: number;
    page_size?: number;
  }) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.query) {
      where.push('(s.title LIKE ? OR s.notes LIKE ? OR s.url LIKE ? OR s.publisher LIKE ?)');
      const q = `%${opts.query}%`;
      params.push(q, q, q, q);
    }
    if (opts.source_type) {
      where.push('s.source_type = ?');
      params.push(opts.source_type);
    }
    if (opts.verification_status) {
      where.push('s.verification_status = ?');
      params.push(opts.verification_status);
    }
    if (opts.confidence_level) {
      where.push('s.confidence_level = ?');
      params.push(opts.confidence_level);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.page_size ?? 20));
    const totalRow = await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM source_records s ${whereSql}`, params);
    const total = totalRow?.n ?? 0;
    const rows = await db.all(
      `SELECT s.* FROM source_records s ${whereSql} ORDER BY s.verification_status ASC, s.last_verified_date DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { data: rows as SourceRecord[], total, page, page_size: pageSize, total_pages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async function getSourceRecord(id: string): Promise<SourceRecord | undefined> {
    return db.get<SourceRecord>('SELECT * FROM source_records WHERE id = ?', [id]);
  }

  return { listSourceRecords, getSourceRecord };
}

export type SourceRecordsRepo = ReturnType<typeof createSourceRecordsRepo>;

/** Back-compatible export (repo renamed alongside the `source_records` table). */
export const createSourcesRepo = createSourceRecordsRepo;
export type SourcesRepo = SourceRecordsRepo;
