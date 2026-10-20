"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCitiesRepo = createCitiesRepo;
function createCitiesRepo(db) {
    async function listLocations() {
        return db.all(`SELECT l.*,
        (SELECT COUNT(DISTINCT cl.company_id) FROM company_locations cl WHERE cl.location_id = l.id) AS tracked_company_count
       FROM locations l ORDER BY l.tier ASC, l.name ASC`);
    }
    async function getLocation(id) {
        const location = await db.get(`SELECT l.*,
        (SELECT COUNT(DISTINCT cl.company_id) FROM company_locations cl WHERE cl.location_id = l.id) AS tracked_company_count
       FROM locations l WHERE l.id = ?`, [id]);
        if (!location)
            return null;
        location.metrics = await db.all(`SELECT m.*, s.title AS source_title, s.url AS source_url, s.verification_status AS source_verification_status
       FROM city_metrics m LEFT JOIN source_records s ON s.id = m.source_id
       WHERE m.location_id = ? ORDER BY m.metric_name ASC`, [id]);
        location.policies = await db.all(`SELECT p.*, s.title AS source_title, s.url AS source_url, s.publisher AS source_publisher FROM policy_records p
       LEFT JOIN source_records s ON s.id = p.source_id WHERE p.state = ? ORDER BY p.effective_date DESC`, [location.state]);
        return location;
    }
    async function compareCities(ids) {
        const placeholders = ids.map(() => '?').join(',');
        const locations = await db.all(`SELECT l.*,
        (SELECT COUNT(DISTINCT cl.company_id) FROM company_locations cl WHERE cl.location_id = l.id) AS tracked_company_count
       FROM locations l WHERE l.id IN (${placeholders})`, ids);
        const metrics = await db.all(`SELECT m.*, s.title AS source_title, s.url AS source_url, s.verification_status AS source_verification_status
       FROM city_metrics m LEFT JOIN source_records s ON s.id = m.source_id
       WHERE m.location_id IN (${placeholders}) ORDER BY m.metric_name ASC`, ids);
        const byCity = new Map();
        for (const m of metrics) {
            const key = m.location_id;
            if (!byCity.has(key))
                byCity.set(key, []);
            byCity.get(key).push(m);
        }
        return locations.map((loc) => ({
            ...loc,
            metrics: byCity.get(loc.id) ?? [],
        }));
    }
    return { listLocations, getLocation, compareCities };
}
//# sourceMappingURL=cities.js.map