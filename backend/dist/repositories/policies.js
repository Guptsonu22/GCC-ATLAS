"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPoliciesRepo = createPoliciesRepo;
function createPoliciesRepo(db) {
    async function listSectors() {
        return db.all('SELECT id, name, description FROM sectors ORDER BY name ASC');
    }
    async function listPolicies(filters = {}) {
        const where = [];
        const params = [];
        if (filters.state) {
            where.push('p.state = ?');
            params.push(filters.state);
        }
        if (filters.status) {
            where.push('p.status = ?');
            params.push(filters.status);
        }
        if (filters.policy_type) {
            where.push('p.policy_type = ?');
            params.push(filters.policy_type);
        }
        if (filters.active_only) {
            where.push('p.is_active = 1');
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        return db.all(`SELECT p.*, s.title AS source_title, s.url AS source_url, s.publisher AS source_publisher,
              s.verification_status AS source_verification_status
       FROM policy_records p LEFT JOIN source_records s ON s.id = p.source_id
       ${whereSql}
       ORDER BY p.is_active DESC, p.effective_date DESC`, params);
    }
    async function getPolicy(id) {
        return db.get(`SELECT p.*, s.title AS source_title, s.url AS source_url, s.publisher AS source_publisher FROM policy_records p
       LEFT JOIN source_records s ON s.id = p.source_id WHERE p.id = ?`, [id]);
    }
    return { listPolicies, getPolicy, listSectors };
}
//# sourceMappingURL=policies.js.map