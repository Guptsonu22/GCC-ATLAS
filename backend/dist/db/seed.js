"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSchema = void 0;
exports.importDataset = importDataset;
exports.seedDatabase = seedDatabase;
exports.ensureSeeded = ensureSeeded;
require("dotenv/config");
const database_1 = require("./database");
Object.defineProperty(exports, "initializeSchema", { enumerable: true, get: function () { return database_1.initializeSchema; } });
const seed_data_1 = require("../data/seed-data");
const seed_data_2 = require("../data/seed-data");
const quality_1 = require("../data/quality");
/** Upserts with stable ids: same id -> row content refreshed; new id -> inserted. */
async function upsert(db, table, key, columns, values) {
    const assignments = columns.filter((c) => c !== key).map((c) => `${c} = excluded.${c}`);
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})
    ON CONFLICT(${key}) DO UPDATE SET ${assignments.join(', ')}`;
    await db.run(sql, values);
}
async function insertOrIgnore(db, table, columns, values) {
    const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    await db.run(sql, values);
}
function asSeedDataset() {
    return {
        sectors: seed_data_1.sectors.map((s) => ({ id: s.id, name: s.name })),
        locations: seed_data_1.locations.map((l) => ({ id: l.id, name: l.name, state: l.state, tier: l.tier ?? null })),
        sources: seed_data_1.sources,
        companies: seed_data_1.companies,
        cityMetrics: seed_data_1.cityMetrics,
        policies: seed_data_2.policies,
        announcements: seed_data_1.announcements,
        providers: seed_data_1.providers,
    };
}
async function importDataset(db, { reset = false } = {}) {
    const data = asSeedDataset();
    // ------------------------------------------------- validate before writing
    const report = (0, quality_1.validateSeedDataset)(data, new Date());
    if (report.errors.length > 0) {
        const lines = report.errors.slice(0, 20).join('\n  - ');
        throw new Error(`Import aborted: ${report.errors.length} data-quality error(s)\n  - ${lines}`);
    }
    if (reset) {
        await db.exec(`
      DELETE FROM saved_comparisons;
      DELETE FROM saved_research;
      DELETE FROM announcements;
      DELETE FROM provider_capabilities;
      DELETE FROM provider_sources;
      DELETE FROM service_providers;
      DELETE FROM policy_records;
      DELETE FROM city_metrics;
      DELETE FROM company_sources;
      DELETE FROM company_locations;
      DELETE FROM companies;
      DELETE FROM source_records;
      DELETE FROM locations;
      DELETE FROM sectors;
    `);
    }
    // ------------------------------------------------- reference data (upsert)
    for (const s of seed_data_1.sectors) {
        await upsert(db, 'sectors', 'id', ['id', 'name', 'description', 'updated_at'], [s.id, s.name, s.description ?? null, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    }
    for (const l of seed_data_1.locations) {
        await upsert(db, 'locations', 'id', ['id', 'name', 'state', 'country', 'tier', 'population', 'gdp_per_capita_usd', 'updated_at'], [l.id, l.name, l.state, 'India', l.tier ?? null, l.population ?? null, l.gdp_per_capita_usd ?? null, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    }
    // ------------------------------------------------- provenance register
    for (const s of seed_data_1.sources) {
        await upsert(db, 'source_records', 'id', ['id', 'title', 'url', 'publisher', 'source_type', 'publication_date', 'last_verified_date', 'verification_status', 'confidence_level', 'notes', 'updated_at'], [s.id, s.title, s.url, s.publisher, s.source_type, s.publication_date ?? null, s.last_verified_date ?? null, s.verification_status, s.confidence_level, s.notes ?? null, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    }
    // ------------------------------------------------- companies + locations + evidence trail
    for (const c of seed_data_1.companies) {
        await upsert(db, 'companies', 'id', ['id', 'name', 'parent_company', 'sector_id', 'headquarters_country', 'headquarters_city',
            'india_entry_year', 'operating_status', 'employee_count_india', 'employee_count_global',
            'description', 'website', 'logo_url', 'is_demo_data', 'updated_at'], [c.id, c.name, c.parent_company, c.sector_id, c.headquarters_country, c.headquarters_city,
            c.india_entry_year, c.operating_status, c.employee_count_india, null,
            c.description, c.website, null, 0, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        for (const loc of c.locations) {
            const locId = loc.id ?? (0, database_1.newId)('cl');
            await upsert(db, 'company_locations', 'id', ['id', 'company_id', 'location_id', 'office_type', 'employee_count', 'established_year', 'is_primary', 'source_id', 'updated_at'], [locId, c.id, loc.location_id, loc.office_type, null, loc.established_year ?? null, loc.is_primary ? 1 : 0, c.source_id, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        }
        await insertOrIgnore(db, 'company_sources', ['id', 'company_id', 'source_id', 'field_referenced'], [(0, database_1.newId)('cs'), c.id, c.source_id, 'identity']);
    }
    // ------------------------------------------------- city metrics
    for (const m of seed_data_1.cityMetrics) {
        await upsert(db, 'city_metrics', 'id', ['id', 'location_id', 'metric_name', 'metric_value', 'metric_unit', 'metric_period', 'metric_definition', 'source_id', 'is_estimate', 'confidence_level', 'updated_at'], [m.id ?? (0, database_1.newId)('met'), m.location_id, m.metric_name, m.metric_value, m.metric_unit, m.metric_period, m.metric_definition, m.source_id, m.is_estimate ? 1 : 0, m.confidence_level, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    }
    // ------------------------------------------------- policies
    for (const p of seed_data_2.policies) {
        await upsert(db, 'policy_records', 'id', ['id', 'title', 'state', 'policy_type', 'status', 'description', 'benefits', 'normalized_benefits',
            'eligibility_criteria', 'effective_date', 'expiry_date', 'source_id', 'is_active', 'updated_at'], [p.id, p.title, p.state, p.policy_type, p.status, p.description,
            p.benefits, p.normalized_benefits ?? null, p.eligibility_criteria,
            p.effective_date, p.expiry_date, p.source_id, p.is_active, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    }
    // ------------------------------------------------- announcements
    for (const a of seed_data_1.announcements) {
        await upsert(db, 'announcements', 'id', ['id', 'company_id', 'location_id', 'title', 'summary', 'content', 'announcement_type', 'announcement_date',
            'source_id', 'employee_count_mentioned', 'investment_amount_usd', 'is_verified', 'updated_at'], [a.id, a.company_id, a.location_id, a.title, a.summary, null, a.announcement_type, a.announcement_date,
            a.source_id, a.employee_count_mentioned, a.investment_amount_usd, a.is_verified, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
    }
    // ------------------------------------------------- providers + denormalized capability table
    for (const p of seed_data_1.providers) {
        await upsert(db, 'service_providers', 'id', ['id', 'name', 'category', 'subcategory', 'description', 'website', 'contact_email', 'contact_phone',
            'headquarters_location_id', 'operating_locations', 'case_studies', 'founded_year',
            'employee_count', 'is_verified', 'verification_notes', 'updated_at'], [p.id, p.name, p.category, p.subcategory, p.description, p.website, null, null,
            p.headquarters_location_id, JSON.stringify(p.operating_locations),
            p.case_studies ? JSON.stringify(p.case_studies) : null, p.founded_year, p.employee_count,
            p.is_verified, p.verification_notes, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
        await insertOrIgnore(db, 'provider_sources', ['id', 'provider_id', 'source_id'], [(0, database_1.newId)('ps'), p.id, p.source_id]);
        for (const capability of p.capabilities) {
            await insertOrIgnore(db, 'provider_capabilities', ['id', 'provider_id', 'capability', 'source_id'], [(0, database_1.newId)('pc'), p.id, capability, p.source_id]);
        }
    }
    const table_names = ['sectors', 'locations', 'source_records', 'companies', 'company_locations', 'city_metrics', 'policy_records', 'announcements', 'service_providers', 'provider_capabilities'];
    const table_counts = {};
    let imported = 0;
    for (const t of table_names) {
        const row = await db.get(`SELECT COUNT(*) AS n FROM ${t}`);
        table_counts[t] = row?.n ?? 0;
        imported += row?.n ?? 0;
    }
    return {
        ...report,
        imported,
        table_counts,
    };
}
/** Kept for compatibility with service boot/tests: validate + import, no reset. */
async function seedDatabase(db, { reset = false } = {}) {
    return importDataset(db, { reset });
}
async function ensureSeeded() {
    const db = await (0, database_1.getDatabase)();
    await seedDatabase(db);
}
// CLI entry: npm run seed [-- --check | --reset]
if (require.main === module) {
    (async () => {
        const db = await (0, database_1.getDatabase)();
        const checkOnly = process.argv.includes('--check');
        if (checkOnly) {
            const report = (0, quality_1.validateSeedDataset)(asSeedDataset(), new Date());
            console.log(`Validation: ${report.errors.length} error(s), ${report.warnings.length} warning(s), ${report.staleSources.length} stale source(s)`);
            for (const w of report.warnings)
                console.log(`  [warn] ${w}`);
            for (const e of report.errors)
                console.log(`  [error] ${e}`);
            await (0, database_1.closeDatabase)();
            process.exit(report.errors.length > 0 ? 1 : 0);
            return;
        }
        const result = await importDataset(db, { reset: process.argv.includes('--reset') });
        console.log(`Import complete — ${result.imported} total rows across curated tables.`);
        console.log(`  errors: ${result.errors.length} · warnings: ${result.warnings.length} · stale sources: ${result.staleSources.length}`);
        for (const w of result.warnings)
            console.log(`  [warn] ${w}`);
        const companies = result.table_counts['companies'] ?? 0;
        console.log(`Seed complete. Companies in dataset: ${companies}`);
        await (0, database_1.closeDatabase)();
    })().catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map