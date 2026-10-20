"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.citiesRoutes = citiesRoutes;
const express_1 = require("express");
const cities_1 = require("../repositories/cities");
const validation_1 = require("../utils/validation");
function citiesRoutes(db) {
    const router = (0, express_1.Router)();
    const repo = (0, cities_1.createCitiesRepo)(db);
    router.get('/', async (_req, res, next) => {
        try {
            res.json({ data: await repo.listLocations() });
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/compare', async (req, res, next) => {
        try {
            const { ids } = (0, validation_1.parseOr400)(validation_1.compareSchema, req.query);
            const result = await repo.compareCities(ids);
            if (result.length < 2) {
                // A silently-truncated comparison would look like a working one-column table.
                return void res.status(400).json({
                    error: {
                        code: 'validation_error',
                        message: 'Not enough valid cities for a comparison — check the city ids',
                        details: { requested_ids: ids, resolved: result.map((c) => c.id) },
                    },
                });
            }
            res.json({ data: result, requested_ids: ids });
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/:id', async (req, res, next) => {
        try {
            const city = await repo.getLocation(req.params.id);
            if (!city) {
                return void res.status(404).json({ error: { code: 'not_found', message: `City '${req.params.id}' not found` } });
            }
            res.json(city);
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=cities.js.map