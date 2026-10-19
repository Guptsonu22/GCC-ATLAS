"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSavedResearchRepo = createSavedResearchRepo;
const database_1 = require("../db/database");
/**
 * Ownership strategy: every saved record is scoped to an anonymous session key
 * supplied by the client (X-Session-Key header). Reads AND writes are filtered
 * by session_key, so records created in one browser are never exposed to
 * another. There is no fixed-user fallback: an absent or invalid key is a 400.
 */
function createSavedResearchRepo(db) {
    async function listSaved(sessionKey) {
        return db.all('SELECT * FROM saved_research WHERE session_key = ? ORDER BY updated_at DESC', [sessionKey]);
    }
    async function getSaved(id, sessionKey) {
        return db.get('SELECT * FROM saved_research WHERE id = ? AND session_key = ?', [id, sessionKey]);
    }
    async function createSaved(input) {
        const id = (0, database_1.newId)('sr');
        await db.run(`INSERT INTO saved_research (id, session_key, user_id, name, type, data) VALUES (?, ?, ?, ?, ?, ?)`, [id, input.session_key, input.user_id ?? null, input.name, input.type, JSON.stringify(input.data)]);
        return getSaved(id, input.session_key);
    }
    async function updateSaved(id, sessionKey, input) {
        const existing = await getSaved(id, sessionKey);
        if (!existing)
            return null;
        const name = input.name ?? existing.name;
        const data = input.data !== undefined ? JSON.stringify(input.data) : existing.data;
        await db.run(`UPDATE saved_research SET name = ?, data = ?, updated_at = datetime('now') WHERE id = ? AND session_key = ?`, [name, data, id, sessionKey]);
        return getSaved(id, sessionKey);
    }
    async function deleteSaved(id, sessionKey) {
        const result = await db.run('DELETE FROM saved_research WHERE id = ? AND session_key = ?', [id, sessionKey]);
        return (result.changes ?? 0) > 0;
    }
    return { listSaved, getSaved, createSaved, updateSaved, deleteSaved };
}
//# sourceMappingURL=saved-research.js.map