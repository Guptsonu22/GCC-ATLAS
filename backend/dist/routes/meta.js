"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaRoutes = metaRoutes;
const express_1 = require("express");
const source_records_1 = require("../repositories/source-records");
const announcements_1 = require("../repositories/announcements");
const dashboard_1 = require("../repositories/dashboard");
const policies_1 = require("../repositories/policies");
const validation_1 = require("../utils/validation");
const env_1 = require("../utils/env");
const STARTED_AT = Date.now();
function metaRoutes(db) {
    const router = (0, express_1.Router)();
    const sourceRecordsRepo = (0, source_records_1.createSourceRecordsRepo)(db);
    const announcementsRepo = (0, announcements_1.createAnnouncementsRepo)(db);
    const dashboardRepo = (0, dashboard_1.createDashboardRepo)(db);
    const policiesRepo = (0, policies_1.createPoliciesRepo)(db);
    // Health check: verifies DB connectivity and reports the assistant mode.
    router.get('/health', async (_req, res, next) => {
        try {
            const env = (0, env_1.loadEnv)();
            let database = 'error';
            try {
                await db.get('SELECT 1');
                database = 'ok';
            }
            catch {
                database = 'error';
            }
            res.status(database === 'ok' ? 200 : 503).json({
                status: database === 'ok' ? 'ok' : 'degraded',
                service: 'gcc-atlas-api',
                version: '0.1.0',
                mode: (0, env_1.getConfiguredAiMode)(env),
                database,
                uptime_seconds: Math.round((Date.now() - STARTED_AT) / 1000),
                time: new Date().toISOString(),
            });
        }
        catch (err) {
            next(err);
        }
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
    // Source records (provenance register backing every claim in the app)
    router.get('/source-records', async (req, res, next) => {
        try {
            const filters = (0, validation_1.parseOr400)(validation_1.sourceFiltersSchema, req.query);
            res.json(await sourceRecordsRepo.listSourceRecords(filters));
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/source-records/:id', async (req, res, next) => {
        try {
            const usage = await sourceRecordsRepo.getSourceUsage(req.params.id);
            if (!usage) {
                return void res.status(404).json({ error: { code: 'not_found', message: `Source '${req.params.id}' not found` } });
            }
            res.json(usage);
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
    // Policy records (state incentive policies with draft/finalized status)
    router.get('/policies', async (req, res, next) => {
        try {
            const filters = (0, validation_1.parseOr400)(validation_1.policyFiltersSchema, req.query);
            res.json({ data: await policiesRepo.listPolicies(filters) });
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/policies/:id', async (req, res, next) => {
        try {
            const policy = await policiesRepo.getPolicy(req.params.id);
            if (!policy) {
                return void res.status(404).json({ error: { code: 'not_found', message: `Policy '${req.params.id}' not found` } });
            }
            res.json(policy);
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=meta.js.map