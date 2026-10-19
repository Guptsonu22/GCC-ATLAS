import { Router, type Request, type Response, type NextFunction } from 'express';
import { createSourceRecordsRepo } from '../repositories/source-records';
import { createAnnouncementsRepo } from '../repositories/announcements';
import { createDashboardRepo } from '../repositories/dashboard';
import { createPoliciesRepo } from '../repositories/policies';
import { sourceFiltersSchema, announcementFiltersSchema, policyFiltersSchema, parseOr400 } from '../utils/validation';
import { loadEnv, getConfiguredAiMode } from '../utils/env';import type { Database } from 'sqlite';

const STARTED_AT = Date.now();

export function metaRoutes(db: Database): Router {
  const router = Router();
  const sourceRecordsRepo = createSourceRecordsRepo(db);
  const announcementsRepo = createAnnouncementsRepo(db);
  const dashboardRepo = createDashboardRepo(db);
  const policiesRepo = createPoliciesRepo(db);

  // Health check: verifies DB connectivity and reports the assistant mode.
  router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const env = loadEnv();
      let database: 'ok' | 'error' = 'error';
      try {
        await db.get('SELECT 1');
        database = 'ok';
      } catch {
        database = 'error';
      }
      res.status(database === 'ok' ? 200 : 503).json({
        status: database === 'ok' ? 'ok' : 'degraded',
        service: 'gcc-atlas-api',
        version: '0.1.0',
        mode: getConfiguredAiMode(env),
        database,
        uptime_seconds: Math.round((Date.now() - STARTED_AT) / 1000),
        time: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  // Dashboard stats
  router.get('/dashboard/stats', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await dashboardRepo.getStats());
    } catch (err) {
      next(err);
    }
  });

  // Source records (provenance register backing every claim in the app)
  router.get('/source-records', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseOr400(sourceFiltersSchema, req.query);
      res.json(await sourceRecordsRepo.listSourceRecords(filters));
    } catch (err) {
      next(err);
    }
  });

  router.get('/source-records/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const source = await sourceRecordsRepo.getSourceRecord(req.params.id as string);
      if (!source) {
        return void res.status(404).json({ error: { code: 'not_found', message: `Source '${req.params.id}' not found` } });
      }
      res.json(source);
    } catch (err) {
      next(err);
    }
  });

  // Sectors
  router.get('/sectors', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await policiesRepo.listSectors() });
    } catch (err) {
      next(err);
    }
  });

  // Announcements
  router.get('/announcements', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseOr400(announcementFiltersSchema, req.query);
      res.json(await announcementsRepo.listAnnouncements(filters));
    } catch (err) {
      next(err);
    }
  });

  // Policy records (state incentive policies with draft/finalized status)
  router.get('/policies', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseOr400(policyFiltersSchema, req.query);
      res.json({ data: await policiesRepo.listPolicies(filters) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
