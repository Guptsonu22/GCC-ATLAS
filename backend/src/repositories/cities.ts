import type { Database } from 'sqlite';
import { newId } from '../db/database';

export function createCitiesRepo(db: Database) {
  async function listLocations() {
    return db.all(
      `SELECT l.*,
        (SELECT COUNT(DISTINCT cl.company_id) FROM company_locations cl WHERE cl.location_id = l.id) AS tracked_company_count
       FROM locations l ORDER BY l.tier ASC, l.name ASC`,
    );
  }

  async function getLocation(id: string) {
    const location = await db.get(
      `SELECT l.*,
        (SELECT COUNT(DISTINCT cl.company_id) FROM company_locations cl WHERE cl.location_id = l.id) AS tracked_company_count
       FROM locations l WHERE l.id = ?`,
      [id],
    );
    if (!location) return null;
    (location as Record<string, unknown>).metrics = await db.all(
      `SELECT m.*, s.title AS source_title, s.url AS source_url, s.verification_status AS source_verification_status
       FROM city_metrics m LEFT JOIN sources s ON s.id = m.source_id
       WHERE m.location_id = ? ORDER BY m.metric_name ASC`,
      [id],
    );
    (location as Record<string, unknown>).policies = await db.all(
      `SELECT p.*, s.title AS source_title, s.url AS source_url FROM policies p
       LEFT JOIN sources s ON s.id = p.source_id WHERE p.state = ? ORDER BY p.effective_date DESC`,
      [(location as Record<string, unknown>).state],
    );
    return location;
  }

  async function compareCities(ids: string[]) {
    const placeholders = ids.map(() => '?').join(',');
    const locations = await db.all(`SELECT * FROM locations WHERE id IN (${placeholders})`, ids);
    const metrics = await db.all(
      `SELECT m.*, s.title AS source_title, s.url AS source_url, s.verification_status AS source_verification_status
       FROM city_metrics m LEFT JOIN sources s ON s.id = m.source_id
       WHERE m.location_id IN (${placeholders}) ORDER BY m.metric_name ASC`,
      ids,
    );
    const byCity = new Map<string, unknown[]>();
    for (const m of metrics) {
      const key = (m as Record<string, unknown>).location_id as string;
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key)!.push(m);
    }
    return locations.map((loc) => ({
      ...loc,
      metrics: byCity.get((loc as Record<string, unknown>).id as string) ?? [],
    }));
  }

  return { listLocations, getLocation, compareCities };
}

export type CitiesRepo = ReturnType<typeof createCitiesRepo>;