import { Router, type Request, type Response, type NextFunction } from 'express';
import { createCitiesRepo } from '../repositories/cities';
import { compareSchema, parseOr400 } from '../utils/validation';
import type { Database } from 'sqlite';

export function citiesRoutes(db: Database): Router {
  const router = Router();
  const repo = createCitiesRepo(db);

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await repo.listLocations() });
    } catch (err) {
      next(err);
    }
  });

  router.get('/compare', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = parseOr400(compareSchema, req.query);
      const result = await repo.compareCities(ids);
      if (result.length < 2) {
        // A silently-truncated comparison would look like a working one-column table.
        return void res.status(400).json({
          error: {
            code: 'validation_error',
            message: 'Not enough valid cities for a comparison — check the city ids',
            details: { requested_ids: ids, resolved: result.map((c) => ((c as Record<string, unknown>).id as string)) },
          },
        });
      }
      res.json({ data: result, requested_ids: ids });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const city = await repo.getLocation(req.params.id as string);
      if (!city) {
        return void res.status(404).json({ error: { code: 'not_found', message: `City '${req.params.id}' not found` } });
      }
      res.json(city);
    } catch (err) {
      next(err);
    }
  });

  return router;
}