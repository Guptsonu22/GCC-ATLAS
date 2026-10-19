"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPoliciesRepo = createPoliciesRepo;
function createPoliciesRepo(db) {
    async function listSectors() {
        return db.all('SELECT id, name, description FROM sectors ORDER BY name ASC');
    }
    async function listPolicies() {
        return db.all(`SELECT p.*, s.title AS source_title, s.url AS source_url, s.verification_status AS source_verification_status
       FROM policies p LEFT JOIN sources s ON s.id = p.source_id
       ORDER BY p.is_active DESC, p.effective_date DESC`);
    }
    async function getPolicy(id) {
        return db.get(`SELECT p.*, s.title AS source_title, s.url AS source_url FROM policies p
       LEFT JOIN sources s ON s.id = p.source_id WHERE p.id = ?`, [id]);
    }
    return { listPolicies, getPolicy, listSectors };
}
//# sourceMappingURL=policies.js.map