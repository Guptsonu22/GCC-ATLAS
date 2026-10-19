import { Router, type Request, type Response, type NextFunction } from 'express';
import { createSavedResearchRepo } from '../repositories/saved-research';
import { savedResearchCreateSchema, savedResearchUpdateSchema, parseOr400 } from '../utils/validation';
import type { Database } from 'sqlite';

/**
 * Prototype note: there is no auth in this prototype; a fixed user id is used
 * and persisted to SQLite. Auth is a documented non-goal for this phase.
 */
const DEFAULT_USER_ID = 'prototype-user';

export function savedResearchRoutes(db: Database): Router {
  const router = Router();
  const repo = createSavedResearchRepo(db);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
      res.json({ data: await repo.listSaved(userId) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = parseOr400(savedResearchCreateSchema, req.body);
      const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
      const saved = await repo.createSaved({ user_id: userId, name: input.name, type: input.type, data: input.data });
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
      const saved = await repo.getSaved(req.params.id as string, userId);
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
      const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
      const saved = await repo.updateSaved(req.params.id as string, userId, input);
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
      const userId = (req.headers['x-user-id'] as string) || DEFAULT_USER_ID;
      const deleted = await repo.deleteSaved(req.params.id as string, userId);
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