import { Router, type Request, type Response, type NextFunction } from 'express';
import { createSavedComparisonsRepo } from '../repositories/saved-comparisons';
import { savedComparisonCreateSchema, savedComparisonPatchSchema, parseOr400, sessionKeySchema } from '../utils/validation';
import type { Database } from 'sqlite';

/**
 * Saved city comparisons. Anonymous ownership via the required
 * `X-Session-Key` header — same strategy as /api/saved-research.
 */
export function savedComparisonsRoutes(db: Database): Router {
  const router = Router();
  const repo = createSavedComparisonsRepo(db);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      res.json({ data: await repo.listComparisons(sessionKey) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = parseOr400(savedComparisonCreateSchema, req.body);
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const saved = await repo.createComparison(sessionKey, input);
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patch = parseOr400(savedComparisonPatchSchema, req.body);
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const renamed = await repo.renameComparison(req.params.id as string, sessionKey, patch.name);
      if (!renamed) {
        return void res.status(404).json({ error: { code: 'not_found', message: 'Saved comparison not found' } });
      }
      const saved = await repo.getComparison(req.params.id as string, sessionKey);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {    try {
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const saved = await repo.getComparison(req.params.id as string, sessionKey);
      if (!saved) {
        return void res.status(404).json({ error: { code: 'not_found', message: 'Saved comparison not found' } });
      }
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const deleted = await repo.deleteComparison(req.params.id as string, sessionKey);
      if (!deleted) {
        return void res.status(404).json({ error: { code: 'not_found', message: 'Saved comparison not found' } });
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
