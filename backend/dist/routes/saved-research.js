"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savedResearchRoutes = savedResearchRoutes;
const express_1 = require("express");
const saved_research_1 = require("../repositories/saved-research");
const validation_1 = require("../utils/validation");
/**
 * Prototype note: there is no auth in this prototype; a fixed user id is used
 * and persisted to SQLite. Auth is a documented non-goal for this phase.
 */
const DEFAULT_USER_ID = 'prototype-user';
function savedResearchRoutes(db) {
    const router = (0, express_1.Router)();
    const repo = (0, saved_research_1.createSavedResearchRepo)(db);
    router.get('/', async (req, res, next) => {
        try {
            const userId = req.headers['x-user-id'] || DEFAULT_USER_ID;
            res.json({ data: await repo.listSaved(userId) });
        }
        catch (err) {
            next(err);
        }
    });
    router.post('/', async (req, res, next) => {
        try {
            const input = (0, validation_1.parseOr400)(validation_1.savedResearchCreateSchema, req.body);
            const userId = req.headers['x-user-id'] || DEFAULT_USER_ID;
            const saved = await repo.createSaved({ user_id: userId, name: input.name, type: input.type, data: input.data });
            res.status(201).json(saved);
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/:id', async (req, res, next) => {
        try {
            const userId = req.headers['x-user-id'] || DEFAULT_USER_ID;
            const saved = await repo.getSaved(req.params.id, userId);
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
            const userId = req.headers['x-user-id'] || DEFAULT_USER_ID;
            const saved = await repo.updateSaved(req.params.id, userId, input);
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
            const userId = req.headers['x-user-id'] || DEFAULT_USER_ID;
            const deleted = await repo.deleteSaved(req.params.id, userId);
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