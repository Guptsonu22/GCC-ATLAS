"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaRoutes = metaRoutes;
const express_1 = require("express");
const sources_1 = require("../repositories/sources");
const announcements_1 = require("../repositories/announcements");
const dashboard_1 = require("../repositories/dashboard");
const policies_1 = require("../repositories/policies");
const validation_1 = require("../utils/validation");
function metaRoutes(db) {
    const router = (0, express_1.Router)();
    const sourcesRepo = (0, sources_1.createSourcesRepo)(db);
    const announcementsRepo = (0, announcements_1.createAnnouncementsRepo)(db);
    const dashboardRepo = (0, dashboard_1.createDashboardRepo)(db);
    const policiesRepo = (0, policies_1.createPoliciesRepo)(db);
    // Health
    router.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'gcc-atlas-api', time: new Date().toISOString() });
    });
    // Dashboard stats
    router.get('/dashboard/stats', async (_req, res, next) => {
        try {
            res.json(await dashboardRepo.getStats());
        }
        catch (err) {
            next(err);
        }
    });
    // Sources
    router.get('/sources', async (req, res, next) => {
        try {
            const filters = (0, validation_1.parseOr400)(validation_1.sourceFiltersSchema, req.query);
            res.json(await sourcesRepo.listSources(filters));
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/sources/:id', async (req, res, next) => {
        try {
            const source = await sourcesRepo.getSource(req.params.id);
            if (!source) {
                return void res.status(404).json({ error: { code: 'not_found', message: `Source '${req.params.id}' not found` } });
            }
            res.json(source);
        }
        catch (err) {
            next(err);
        }
    });
    // Sectors
    router.get('/sectors', async (_req, res, next) => {
        try {
            res.json({ data: await policiesRepo.listSectors() });
        }
        catch (err) {
            next(err);
        }
    });
    // Announcements
    router.get('/announcements', async (req, res, next) => {
        try {
            const filters = (0, validation_1.parseOr400)(validation_1.announcementFiltersSchema, req.query);
            res.json(await announcementsRepo.listAnnouncements(filters));
        }
        catch (err) {
            next(err);
        }
    });
    // Policies
    router.get('/policies', async (_req, res, next) => {
        try {
            res.json({ data: await policiesRepo.listPolicies() });
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=meta.js.map