import type { Database } from 'sqlite';

export function createAnnouncementsRepo(db: Database) {
  async function listAnnouncements(opts: { company_id?: string; location_id?: string; announcement_type?: string; days?: number; page?: number; page_size?: number }) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (opts.company_id) {
      where.push('a.company_id = ?');
      params.push(opts.company_id);
    }
    if (opts.location_id) {
      where.push('(a.location_id = ? OR EXISTS (SELECT 1 FROM company_locations cl WHERE cl.company_id = a.company_id AND cl.location_id = ?))');
      params.push(opts.location_id, opts.location_id);
    }
    if (opts.announcement_type) {
      where.push('a.announcement_type = ?');
      params.push(opts.announcement_type);
    }
    if (opts.days) {
      where.push(`a.announcement_date >= date('now', ?)`);
      params.push(`-${Math.floor(opts.days)} days`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.page_size ?? 20));
    const totalRow = await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM announcements a ${whereSql}`, params);
    const total = totalRow?.n ?? 0;
    const rows = await db.all(
      `SELECT a.*, c.name AS company_name, l.name AS location_name, s.title AS source_title, s.url AS source_url, s.verification_status AS source_verification_status
       FROM announcements a
       LEFT JOIN companies c ON c.id = a.company_id
       LEFT JOIN locations l ON l.id = a.location_id
       LEFT JOIN sources s ON s.id = a.source_id
       ${whereSql} ORDER BY a.announcement_date DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { data: rows, total, page, page_size: pageSize, total_pages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  return { listAnnouncements };
}

export type AnnouncementsRepo = ReturnType<typeof createAnnouncementsRepo>;