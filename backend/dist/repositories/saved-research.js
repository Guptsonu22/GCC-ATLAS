"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSavedResearchRepo = createSavedResearchRepo;
const database_1 = require("../db/database");
function createSavedResearchRepo(db) {
    async function listSaved(userId) {
        return db.all('SELECT * FROM saved_research WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    }
    async function getSaved(id, userId) {
        return db.get('SELECT * FROM saved_research WHERE id = ? AND user_id = ?', [id, userId]);
    }
    async function createSaved(input) {
        const id = (0, database_1.newId)('sr');
        await db.run(`INSERT INTO saved_research (id, user_id, name, type, data) VALUES (?, ?, ?, ?, ?)`, [id, input.user_id, input.name, input.type, JSON.stringify(input.data)]);
        return getSaved(id, input.user_id);
    }
    async function updateSaved(id, userId, input) {
        const existing = await getSaved(id, userId);
        if (!existing)
            return null;
        const name = input.name ?? existing.name;
        const data = input.data !== undefined ? JSON.stringify(input.data) : existing.data;
        await db.run(`UPDATE saved_research SET name = ?, data = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`, [name, data, id, userId]);
        return getSaved(id, userId);
    }
    async function deleteSaved(id, userId) {
        const result = await db.run('DELETE FROM saved_research WHERE id = ? AND user_id = ?', [id, userId]);
        return (result.changes ?? 0) > 0;
    }
    return { listSaved, getSaved, createSaved, updateSaved, deleteSaved };
}
//# sourceMappingURL=saved-research.js.map