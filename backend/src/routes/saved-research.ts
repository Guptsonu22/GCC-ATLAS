import { Router, type Request, type Response, type NextFunction } from 'express';
import { createSavedResearchRepo } from '../repositories/saved-research';
import { savedResearchCreateSchema, savedResearchUpdateSchema, parseOr400, sessionKeySchema } from '../utils/validation';
import type { Database } from 'sqlite';

/**
 * Ownership strategy: the client generates a stable anonymous session key
 * (uuid stored in localStorage) and sends it as `X-Session-Key`. Every
 * list/read/update/delete is scoped to that key so data is never shared
 * across browsers. A missing/invalid key is a 400, not a silent fallback.
 */
export function savedResearchRoutes(db: Database): Router {
  const router = Router();
  const repo = createSavedResearchRepo(db);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      res.json({ data: await repo.listSaved(sessionKey) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = parseOr400(savedResearchCreateSchema, req.body);
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const saved = await repo.createSaved({ session_key: sessionKey, name: input.name, type: input.type, data: input.data });
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const saved = await repo.getSaved(req.params.id as string, sessionKey);
      if (!saved) {
        return void res.status(404).json({ error: { code: 'not_found', message: 'Saved item not found' } });
      }
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = parseOr400(savedResearchUpdateSchema, req.body);
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const saved = await repo.updateSaved(req.params.id as string, sessionKey, input);
      if (!saved) {
        return void res.status(404).json({ error: { code: 'not_found', message: 'Saved item not found' } });
      }
      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionKey = parseOr400(sessionKeySchema, req.headers['x-session-key']);
      const deleted = await repo.deleteSaved(req.params.id as string, sessionKey);
      if (!deleted) {
        return void res.status(404).json({ error: { code: 'not_found', message: 'Saved item not found' } });
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
