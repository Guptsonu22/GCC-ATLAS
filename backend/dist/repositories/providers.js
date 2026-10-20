"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProvidersRepo = createProvidersRepo;
function createProvidersRepo(db) {
    async function listProviders(filters) {
        const where = [];
        const params = [];
        if (filters.category) {
            where.push('p.category = ?');
            params.push(filters.category);
        }
        if (filters.query) {
            where.push('(p.name LIKE ? OR p.description LIKE ? OR p.subcategory LIKE ?)');
            const q = `%${filters.query}%`;
            params.push(q, q, q);
        }
        if (filters.location_id) {
            // operating_locations is a JSON array; filter via LIKE on JSON text (acceptable for prototype)
            where.push('(p.operating_locations LIKE ? OR p.headquarters_location_id = ?)');
            params.push(`%"${filters.location_id}"%`, filters.location_id);
        }
        if (filters.capability) {
            where.push('EXISTS (SELECT 1 FROM provider_capabilities pc WHERE pc.provider_id = p.id AND pc.capability LIKE ?)');
            params.push(`%${filters.capability}%`);
        }
        if (typeof filters.is_verified === 'boolean') {
            where.push('p.is_verified = ?');
            params.push(filters.is_verified ? 1 : 0);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const page = Math.max(1, filters.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, filters.page_size ?? 20));
        const totalRow = await db.get(`SELECT COUNT(*) AS n FROM service_providers p ${whereSql}`, params);
        const total = totalRow?.n ?? 0;
        const rows = await db.all(`SELECT p.* FROM service_providers p ${whereSql} ORDER BY p.name ASC LIMIT ? OFFSET ?`, [...params, pageSize, (page - 1) * pageSize]);
        const items = await hydrateMany(rows);
        return { data: items, total, page, page_size: pageSize, total_pages: Math.max(1, Math.ceil(total / pageSize)) };
    }
    async function hydrateMany(rows) {
        const items = [];
        for (const row of rows) {
            const provider = { ...row };
            provider.capability_list = await loadCapabilities(provider.id);
            provider.case_study_list = provider.case_studies ? JSON.parse(provider.case_studies) : [];
            provider.operating_location_objects = provider.operating_locations
                ? await db.all(`SELECT * FROM locations WHERE id IN (${JSON.parse(provider.operating_locations).map(() => '?').join(',')})`, JSON.parse(provider.operating_locations))
                : [];
            if (provider.headquarters_location_id) {
                provider.headquarters_location = await db.get('SELECT * FROM locations WHERE id = ?', [provider.headquarters_location_id]);
            }
            provider.sources = await db.all('SELECT s.* FROM provider_sources ps JOIN source_records s ON s.id = ps.source_id WHERE ps.provider_id = ?', [provider.id]);
            items.push(provider);
        }
        return items;
    }
    /** Normalized capabilities from the provider_capabilities table (Phase 3 refactor). */
    async function loadCapabilities(providerId) {
        const rows = (await db.all(`SELECT c.capability, c.source_id, s.url AS source_url
       FROM provider_capabilities c LEFT JOIN source_records s ON s.id = c.source_id
       WHERE c.provider_id = ? ORDER BY c.capability ASC`, [providerId]));
        return rows.map((r) => ({
            capability: r.capability,
            source_id: r.source_id,
            source_url: r.source_url ?? null,
        }));
    }
    async function getProvider(id) {
        const row = await db.get('SELECT * FROM service_providers WHERE id = ?', [id]);
        if (!row)
            return null;
        const [provider] = await hydrateMany([row]);
        return provider ?? null;
    }
    return { listProviders, getProvider };
}
//# sourceMappingURL=providers.js.map