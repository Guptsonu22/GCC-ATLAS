import { Router, type Request, type Response, type NextFunction } from 'express';
import { createSourcesRepo } from '../repositories/sources';
import { createAnnouncementsRepo } from '../repositories/announcements';
import { createDashboardRepo } from '../repositories/dashboard';
import { createPoliciesRepo } from '../repositories/policies';
import { sourceFiltersSchema, announcementFiltersSchema, parseOr400 } from '../utils/validation';
import type { Database } from 'sqlite';

export function metaRoutes(db: Database): Router {
  const router = Router();
  const sourcesRepo = createSourcesRepo(db);
  const announcementsRepo = createAnnouncementsRepo(db);
  const dashboardRepo = createDashboardRepo(db);
  const policiesRepo = createPoliciesRepo(db);

  // Health
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'gcc-atlas-api', time: new Date().toISOString() });
  });

  // Dashboard stats
  router.get('/dashboard/stats', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await dashboardRepo.getStats());
    } catch (err) {
      next(err);
    }
  });

  // Sources
  router.get('/sources', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseOr400(sourceFiltersSchema, req.query);
      res.json(await sourcesRepo.listSources(filters));
    } catch (err) {
      next(err);
    }
  });

  router.get('/sources/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const source = await sourcesRepo.getSource(req.params.id as string);
      if (!source) {
        return void res.status(404).json({ error: { code: 'not_found', message: `Source '${req.params.id}' not found` } });
      }
      res.json(source);
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

  // Policies
  router.get('/policies', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await policiesRepo.listPolicies() });
    } catch (err) {
      next(err);
    }
  });

  return router;
}