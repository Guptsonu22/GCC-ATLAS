"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSchema = void 0;
exports.seedDatabase = seedDatabase;
exports.ensureSeeded = ensureSeeded;
const database_1 = require("./database");
Object.defineProperty(exports, "initializeSchema", { enumerable: true, get: function () { return database_1.initializeSchema; } });
const seed_data_1 = require("../data/seed-data");
async function seedDatabase(db, { reset = false } = {}) {
    if (reset) {
        await db.exec(`
      DELETE FROM saved_research;
      DELETE FROM announcements;
      DELETE FROM policies;
      DELETE FROM provider_sources;
      DELETE FROM providers;
      DELETE FROM city_metrics;
      DELETE FROM company_sources;
      DELETE FROM company_locations;
      DELETE FROM companies;
      DELETE FROM sources;
      DELETE FROM locations;
      DELETE FROM sectors;
    `);
    }
    const existing = await db.get('SELECT COUNT(*) AS n FROM companies');
    if (existing && existing.n > 0) {
        return; // already seeded
    }
    const insertSector = 'INSERT OR IGNORE INTO sectors (id, name, description) VALUES (?, ?, ?)';
    for (const s of seed_data_1.sectors)
        await db.run(insertSector, [s.id, s.name, s.description]);
    const insertLocation = 'INSERT OR IGNORE INTO locations (id, name, state, tier, population, gdp_per_capita_usd) VALUES (?, ?, ?, ?, ?, ?)';
    for (const l of seed_data_1.locations)
        await db.run(insertLocation, [l.id, l.name, l.state, l.tier, l.population, l.gdp_per_capita_usd]);
    const insertSource = `INSERT OR IGNORE INTO sources
    (id, title, url, source_type, publication_date, last_verified_date, verification_status, notes)
    VALUES (?, ?, ?, ?, ?, datetime('now'), ?, ?)`;
    for (const s of seed_data_1.sources)
        await db.run(insertSource, [s.id, s.title, s.url, s.source_type, s.publication_date, s.verification_status, s.notes]);
    const insertCompany = `INSERT INTO companies
    (id, name, parent_company, sector_id, headquarters_country, headquarters_city, india_entry_year,
     operating_status, employee_count_india, employee_count_global, description, website, logo_url, is_demo_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertCompanyLocation = `INSERT INTO company_locations
    (id, company_id, location_id, office_type, employee_count, established_year, is_primary, source_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertCompanySource = `INSERT OR IGNORE INTO company_sources (id, company_id, source_id, field_referenced)
    VALUES (?, ?, ?, ?)`;
    for (const c of seed_data_1.companies) {
        await db.run(insertCompany, [
            c.id, c.name, c.parent_company, c.sector_id, c.headquarters_country, c.headquarters_city,
            c.india_entry_year, c.operating_status, c.employee_count_india, null, c.description, c.website, null, 0,
        ]);
        for (const loc of c.locations) {
            await db.run(insertCompanyLocation, [
                loc.id ?? (0, database_1.newId)('cl'), c.id, loc.location_id, loc.office_type, null,
                loc.established_year ?? null, loc.is_primary ? 1 : 0, c.source_id,
            ]);
        }
        await db.run(insertCompanySource, [(0, database_1.newId)('cs'), c.id, c.source_id, 'identity']);
    }
    const insertMetric = `INSERT OR IGNORE INTO city_metrics
    (id, location_id, metric_name, metric_value, metric_unit, metric_period, metric_definition, source_id, is_estimate, confidence_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    for (const m of seed_data_1.cityMetrics) {
        await db.run(insertMetric, [m.id ?? (0, database_1.newId)('met'), m.location_id, m.metric_name, m.metric_value, m.metric_unit, m.metric_period, m.metric_definition, m.source_id, m.is_estimate ? 1 : 0, m.confidence_level]);
    }
    const insertPolicy = `INSERT INTO policies
    (id, title, state, policy_type, description, benefits, eligibility_criteria, effective_date, expiry_date, source_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    for (const p of seed_data_1.policies) {
        await db.run(insertPolicy, [p.id, p.title, p.state, p.policy_type, p.description, p.benefits, p.eligibility_criteria, p.effective_date, p.expiry_date, p.source_id, p.is_active]);
    }
    const insertAnnouncement = `INSERT INTO announcements
    (id, company_id, location_id, title, summary, content, announcement_type, announcement_date, source_id, employee_count_mentioned, investment_amount_usd, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    for (const a of seed_data_1.announcements) {
        await db.run(insertAnnouncement, [a.id, a.company_id, a.location_id, a.title, a.summary, null, a.announcement_type, a.announcement_date, a.source_id, a.employee_count_mentioned, a.investment_amount_usd, a.is_verified]);
    }
    const insertProvider = `INSERT INTO providers
    (id, name, category, subcategory, description, website, contact_email, contact_phone,
     headquarters_location_id, operating_locations, capabilities, case_studies, founded_year,
     employee_count, is_verified, verification_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertProviderSource = 'INSERT OR IGNORE INTO provider_sources (id, provider_id, source_id) VALUES (?, ?, ?)';
    for (const p of seed_data_1.providers) {
        await db.run(insertProvider, [
            p.id, p.name, p.category, p.subcategory, p.description, p.website, null, null,
            p.headquarters_location_id, JSON.stringify(p.operating_locations), JSON.stringify(p.capabilities),
            p.case_studies, p.founded_year, p.employee_count, p.is_verified, p.verification_notes,
        ]);
        await db.run(insertProviderSource, [(0, database_1.newId)('ps'), p.id, p.source_id]);
    }
}
async function ensureSeeded() {
    const db = await (0, database_1.getDatabase)();
    await seedDatabase(db);
}
// CLI entry: npm run seed
if (require.main === module) {
    (async () => {
        const db = await (0, database_1.getDatabase)();
        await seedDatabase(db, { reset: process.argv.includes('--reset') });
        const row = await db.get('SELECT COUNT(*) AS n FROM companies');
        console.log(`Seed complete. Companies in dataset: ${row?.n ?? 0}`);
        await (0, database_1.closeDatabase)();
    })().catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map