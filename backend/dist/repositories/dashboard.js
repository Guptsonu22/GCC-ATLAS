"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDashboardRepo = createDashboardRepo;
function createDashboardRepo(db) {
    async function getStats() {
        const count = async (sql, params = []) => {
            const row = await db.get(sql, params);
            return row?.n ?? 0;
        };
        const [total_companies, total_locations, total_sectors, total_providers, total_sources, total_announcements,] = await Promise.all([
            count('SELECT COUNT(*) AS n FROM companies'),
            count('SELECT COUNT(*) AS n FROM locations'),
            count('SELECT COUNT(*) AS n FROM sectors'),
            count('SELECT COUNT(*) AS n FROM service_providers'),
            count('SELECT COUNT(*) AS n FROM source_records'),
            count(`SELECT COUNT(*) AS n FROM announcements WHERE announcement_date >= date('now', '-365 days')`),
        ]);
        const companies_by_city = await db.all(`SELECT l.name AS city, COUNT(DISTINCT cl.company_id) AS count
       FROM locations l JOIN company_locations cl ON cl.location_id = l.id
       GROUP BY l.id ORDER BY count DESC`);
        const companies_by_sector = await db.all(`SELECT s.name AS sector, COUNT(c.id) AS count
       FROM sectors s LEFT JOIN companies c ON c.sector_id = s.id
       GROUP BY s.id ORDER BY count DESC`);
        const companies_by_status = await db.all('SELECT operating_status AS status, COUNT(*) AS count FROM companies GROUP BY operating_status ORDER BY count DESC');
        const data_freshness = {
            sources_verified_last_30_days: await count(`SELECT COUNT(*) AS n FROM source_records WHERE last_verified_date >= date('now', '-30 days')`),
            sources_verified_last_90_days: await count(`SELECT COUNT(*) AS n FROM source_records WHERE last_verified_date >= date('now', '-90 days')`),
            stale_sources: await count(`SELECT COUNT(*) AS n FROM source_records WHERE verification_status IN ('stale', 'unverified')`),
            unverified_sources: await count(`SELECT COUNT(*) AS n FROM source_records WHERE verification_status = 'unverified'`),
        };
        return {
            total_companies, total_locations, total_sectors, total_providers, total_sources,
            recent_announcements: total_announcements,
            companies_by_city, companies_by_sector, companies_by_status, data_freshness,
            counting_note: 'Counts reflect the GCC Atlas tracked dataset only, not the total number of GCCs in India. Industry estimates place India\u2019s total GCC count far higher (see NASSCOM\u2013Zinnov).',
        };
    }
    return { getStats };
}
//# sourceMappingURL=dashboard.js.map