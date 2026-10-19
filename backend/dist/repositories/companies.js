"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompaniesRepo = createCompaniesRepo;
function createCompaniesRepo(db) {
    async function listCompanies(filters) {
        const where = [];
        const params = [];
        if (filters.query) {
            where.push('(c.name LIKE ? OR c.parent_company LIKE ? OR c.description LIKE ?)');
            const q = `%${filters.query}%`;
            params.push(q, q, q);
        }
        if (filters.sector_id) {
            where.push('c.sector_id = ?');
            params.push(filters.sector_id);
        }
        if (filters.location_id) {
            where.push('EXISTS (SELECT 1 FROM company_locations cl WHERE cl.company_id = c.id AND cl.location_id = ?)');
            params.push(filters.location_id);
        }
        if (filters.operating_status) {
            where.push('c.operating_status = ?');
            params.push(filters.operating_status);
        }
        if (filters.parent_company) {
            where.push('c.parent_company LIKE ?');
            params.push(`%${filters.parent_company}%`);
        }
        if (typeof filters.is_demo_data === 'boolean') {
            where.push('c.is_demo_data = ?');
            params.push(filters.is_demo_data ? 1 : 0);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const sortColumns = {
            name: 'c.name',
            employee_count_india: 'c.employee_count_india',
            india_entry_year: 'c.india_entry_year',
            created_at: 'c.created_at',
        };
        const sortCol = sortColumns[filters.sort_by ?? 'name'] ?? 'c.name';
        const sortOrder = filters.sort_order === 'desc' ? 'DESC' : 'ASC';
        const page = Math.max(1, filters.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, filters.page_size ?? 20));
        const totalRow = await db.get(`SELECT COUNT(*) AS n FROM companies c ${whereSql}`, params);
        const total = totalRow?.n ?? 0;
        const rows = await db.all(`SELECT c.*, s.name AS sector_name FROM companies c
       LEFT JOIN sectors s ON s.id = c.sector_id
       ${whereSql} ORDER BY ${sortCol} ${sortOrder}, c.name ASC LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize]);
        const items = [];
        for (const row of rows) {
            const company = row;
            company.sector = company.sector_id ? { id: company.sector_id, name: company.sector_name ?? '', description: null, created_at: '', updated_at: '' } : undefined;
            company.locations = await db.all(`SELECT cl.*, l.name AS location_name, l.state AS location_state FROM company_locations cl
         JOIN locations l ON l.id = cl.location_id WHERE cl.company_id = ? ORDER BY cl.is_primary DESC, l.name ASC`, [company.id]);
            items.push(company);
        }
        return {
            data: items,
            total,
            page,
            page_size: pageSize,
            total_pages: Math.max(1, Math.ceil(total / pageSize)),
        };
    }
    async function getCompany(id) {
        const row = await db.get(`SELECT c.*, s.name AS sector_name FROM companies c
       LEFT JOIN sectors s ON s.id = c.sector_id WHERE c.id = ?`, [id]);
        if (!row)
            return null;
        const company = row;
        company.sector = company.sector_id ? { id: company.sector_id, name: company.sector_name ?? '', description: null, created_at: '', updated_at: '' } : undefined;
        company.locations = await db.all(`SELECT cl.*, l.name AS location_name, l.state AS location_state FROM company_locations cl
       JOIN locations l ON l.id = cl.location_id WHERE cl.company_id = ? ORDER BY cl.is_primary DESC, l.name ASC`, [id]);
        company.sources = await db.all(`SELECT s.* FROM company_sources cs JOIN sources s ON s.id = cs.source_id WHERE cs.company_id = ?`, [id]);
        const announcements = await db.all('SELECT * FROM announcements WHERE company_id = ? ORDER BY announcement_date DESC', [id]);
        company.announcements = announcements;
        return company;
    }
    return { listCompanies, getCompany };
}
//# sourceMappingURL=companies.js.map