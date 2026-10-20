"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDashboardRepo = createDashboardRepo;
const quality_1 = require("../data/quality");
function createDashboardRepo(db) {
    /**
     * Record-level verification buckets (definitions documented in
     * data/data-dictionary.md):
     *   verified              — record has >=1 linked source with verification_status='verified'
     *                           whose last_verified_date is within STALE_AFTER_DAYS (365d)
     *   awaiting_verification — record has sources but none of them verified
     *   stale                 — record is verified only through sources whose
     *                           last_verified_date is older than STALE_AFTER_DAYS
     *   conflicting           — record cites any source flagged 'conflicting'
     *                           (always excluded from the other buckets; needs manual review)
     */
    async function verificationBuckets(pairs) {
        const rolls = new Map();
        for (const p of pairs) {
            const roll = rolls.get(p.record_id) ?? { hasFreshVerified: false, hasStaleOnlyVerified: false, hasUnverified: false, hasConflict: false };
            if (p.verification_status === 'conflicting')
                roll.hasConflict = true;
            else if (p.verification_status === 'verified') {
                if (!isStaleDate(p.last_verified_date))
                    roll.hasFreshVerified = true;
                else
                    roll.hasStaleOnlyVerified = true;
            }
            else
                roll.hasUnverified = true;
            rolls.set(p.record_id, roll);
        }
        const out = { verified: 0, awaiting_verification: 0, stale: 0, conflicting: 0, total: rolls.size };
        for (const roll of rolls.values()) {
            if (roll.hasConflict)
                out.conflicting += 1;
            else if (roll.hasStaleOnlyVerified)
                out.stale += 1;
            else if (roll.hasFreshVerified)
                out.verified += 1;
            else
                out.awaiting_verification += 1;
        }
        return out;
    }
    function isStaleDate(lastVerified) {
        if (!lastVerified)
            return true;
        const d = new Date(lastVerified);
        if (Number.isNaN(d.getTime()))
            return true;
        return Date.now() - d.getTime() > quality_1.STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
    }
    async function getStats() {
        const count = async (sql, params = []) => {
            const row = await db.get(sql, params);
            return row?.n ?? 0;
        };
        const [total_companies, total_locations, total_sectors, total_providers, total_sources, total_announcements, total_policies,] = await Promise.all([
            count('SELECT COUNT(*) AS n FROM companies'),
            count('SELECT COUNT(*) AS n FROM locations'),
            count('SELECT COUNT(*) AS n FROM sectors'),
            count('SELECT COUNT(*) AS n FROM service_providers'),
            count('SELECT COUNT(*) AS n FROM source_records'),
            count(`SELECT COUNT(*) AS n FROM announcements WHERE announcement_date >= date('now', '-365 days')`),
            count('SELECT COUNT(*) AS n FROM policy_records'),
        ]);
        const companies_by_city = await db.all(`SELECT l.name AS city, COUNT(DISTINCT cl.company_id) AS count
       FROM locations l JOIN company_locations cl ON cl.location_id = l.id
       GROUP BY l.id ORDER BY count DESC`);
        const companies_by_sector = await db.all(`SELECT s.name AS sector, COUNT(c.id) AS count
       FROM sectors s LEFT JOIN companies c ON c.sector_id = s.id
       GROUP BY s.id ORDER BY count DESC`);
        const companies_by_status = await db.all('SELECT operating_status AS status, COUNT(*) AS count FROM companies GROUP BY operating_status ORDER BY count DESC');
        const policies_by_state = await db.all(`SELECT state, COUNT(*) AS count FROM policy_records GROUP BY state ORDER BY count DESC`);
        const companySourcePairs = await db.all(`SELECT cs.company_id AS record_id, s.verification_status, s.last_verified_date
       FROM company_sources cs JOIN source_records s ON s.id = cs.source_id`);
        const policySourcePairs = await db.all(`SELECT p.id AS record_id, s.verification_status, s.last_verified_date
       FROM policy_records p JOIN source_records s ON s.id = p.source_id`);
        const companies_verification = await verificationBuckets(companySourcePairs);
        const policies_verification = await verificationBuckets(policySourcePairs);
        const data_freshness = {
            sources_verified_last_30_days: await count(`SELECT COUNT(*) AS n FROM source_records WHERE last_verified_date >= date('now', '-30 days')`),
            sources_verified_last_90_days: await count(`SELECT COUNT(*) AS n FROM source_records WHERE last_verified_date >= date('now', '-90 days')`),
            stale_sources: await count(`SELECT COUNT(*) AS n FROM source_records WHERE last_verified_date < date('now', '-${quality_1.STALE_AFTER_DAYS} days')`),
            unverified_sources: await count(`SELECT COUNT(*) AS n FROM source_records WHERE verification_status = 'unverified'`),
        };
        return {
            total_companies, total_locations, total_sectors, total_providers, total_sources, total_policies,
            recent_announcements: total_announcements,
            companies_by_city, companies_by_sector, companies_by_status, policies_by_state,
            companies_verification, policies_verification, data_freshness,
            counting_note: 'Counts reflect the GCC Atlas tracked dataset only, not the total number of GCCs in India. Industry estimates place India\u2019s total GCC count far higher (see NASSCOM\u2013Zinnov).',
            verification_definitions: 'verified = cited source(s) verified within the last 365 days (verification_status=verified AND last_verified_date within threshold). '
                + 'awaiting_verification = record cites sources but no verified one yet. '
                + 'stale = record only backed by sources last verified more than 365 days ago. '
                + 'conflicting = record cites a source flagged conflicting; needs manual review.',
        };
    }
    return { getStats };
}
//# sourceMappingURL=dashboard.js.map