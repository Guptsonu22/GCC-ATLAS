"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providersRoutes = providersRoutes;
const express_1 = require("express");
const providers_1 = require("../repositories/providers");
const validation_1 = require("../utils/validation");
function providersRoutes(db) {
    const router = (0, express_1.Router)();
    const repo = (0, providers_1.createProvidersRepo)(db);
    router.get('/', async (req, res, next) => {
        try {
            const filters = (0, validation_1.parseOr400)(validation_1.providerFiltersSchema, req.query);
            const result = await repo.listProviders(filters);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/:id', async (req, res, next) => {
        try {
            const provider = await repo.getProvider(req.params.id);
            if (!provider) {
                return void res.status(404).json({ error: { code: 'not_found', message: `Provider '${req.params.id}' not found` } });
            }
            res.json(provider);
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=providers.js.map