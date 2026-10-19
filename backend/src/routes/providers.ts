import { Router, type Request, type Response, type NextFunction } from 'express';
import { createProvidersRepo } from '../repositories/providers';
import { providerFiltersSchema, parseOr400 } from '../utils/validation';
import type { Database } from 'sqlite';
import type { ProviderFilters } from '../types';

export function providersRoutes(db: Database): Router {
  const router = Router();
  const repo = createProvidersRepo(db);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseOr400(providerFiltersSchema, req.query) as ProviderFilters;
      const result = await repo.listProviders(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = await repo.getProvider(req.params.id as string);
      if (!provider) {
        return void res.status(404).json({ error: { code: 'not_found', message: `Provider '${req.params.id}' not found` } });
      }
      res.json(provider);
    } catch (err) {
      next(err);
    }
  });

  return router;
}