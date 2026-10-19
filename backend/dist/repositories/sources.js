"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourcesRepo = createSourcesRepo;
function createSourcesRepo(db) {
    async function listSources(opts) {
        const where = [];
        const params = [];
        if (opts.query) {
            where.push('(s.title LIKE ? OR s.notes LIKE ? OR s.url LIKE ?)');
            const q = `%${opts.query}%`;
            params.push(q, q, q);
        }
        if (opts.source_type) {
            where.push('s.source_type = ?');
            params.push(opts.source_type);
        }
        if (opts.verification_status) {
            where.push('s.verification_status = ?');
            params.push(opts.verification_status);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const page = Math.max(1, opts.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, opts.page_size ?? 20));
        const totalRow = await db.get(`SELECT COUNT(*) AS n FROM sources s ${whereSql}`, params);
        const total = totalRow?.n ?? 0;
        const rows = await db.all(`SELECT s.* FROM sources s ${whereSql} ORDER BY s.verification_status ASC, s.last_verified_date DESC LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize]);
        return { data: rows, total, page, page_size: pageSize, total_pages: Math.max(1, Math.ceil(total / pageSize)) };
    }
    async function getSource(id) {
        return db.get('SELECT * FROM sources WHERE id = ?', [id]);
    }
    return { listSources, getSource };
}
//# sourceMappingURL=sources.js.map