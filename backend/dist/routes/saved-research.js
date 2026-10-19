"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savedResearchRoutes = savedResearchRoutes;
const express_1 = require("express");
const saved_research_1 = require("../repositories/saved-research");
const validation_1 = require("../utils/validation");
/**
 * Ownership strategy: the client generates a stable anonymous session key
 * (uuid stored in localStorage) and sends it as `X-Session-Key`. Every
 * list/read/update/delete is scoped to that key so data is never shared
 * across browsers. A missing/invalid key is a 400, not a silent fallback.
 */
function savedResearchRoutes(db) {
    const router = (0, express_1.Router)();
    const repo = (0, saved_research_1.createSavedResearchRepo)(db);
    router.get('/', async (req, res, next) => {
        try {
            const sessionKey = (0, validation_1.parseOr400)(validation_1.sessionKeySchema, req.headers['x-session-key']);
            res.json({ data: await repo.listSaved(sessionKey) });
        }
        catch (err) {
            next(err);
        }
    });
    router.post('/', async (req, res, next) => {
        try {
            const input = (0, validation_1.parseOr400)(validation_1.savedResearchCreateSchema, req.body);
            const sessionKey = (0, validation_1.parseOr400)(validation_1.sessionKeySchema, req.headers['x-session-key']);
            const saved = await repo.createSaved({ session_key: sessionKey, name: input.name, type: input.type, data: input.data });
            res.status(201).json(saved);
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/:id', async (req, res, next) => {
        try {
            const sessionKey = (0, validation_1.parseOr400)(validation_1.sessionKeySchema, req.headers['x-session-key']);
            const saved = await repo.getSaved(req.params.id, sessionKey);
            if (!saved) {
                return void res.status(404).json({ error: { code: 'not_found', message: 'Saved item not found' } });
            }
            res.json(saved);
        }
        catch (err) {
            next(err);
        }
    });
    router.patch('/:id', async (req, res, next) => {
        try {
            const input = (0, validation_1.parseOr400)(validation_1.savedResearchUpdateSchema, req.body);
            const sessionKey = (0, validation_1.parseOr400)(validation_1.sessionKeySchema, req.headers['x-session-key']);
            const saved = await repo.updateSaved(req.params.id, sessionKey, input);
            if (!saved) {
                return void res.status(404).json({ error: { code: 'not_found', message: 'Saved item not found' } });
            }
            res.json(saved);
        }
        catch (err) {
            next(err);
        }
    });
    router.delete('/:id', async (req, res, next) => {
        try {
            const sessionKey = (0, validation_1.parseOr400)(validation_1.sessionKeySchema, req.headers['x-session-key']);
            const deleted = await repo.deleteSaved(req.params.id, sessionKey);
            if (!deleted) {
                return void res.status(404).json({ error: { code: 'not_found', message: 'Saved item not found' } });
            }
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=saved-research.js.map