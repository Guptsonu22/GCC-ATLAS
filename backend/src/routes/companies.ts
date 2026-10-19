import { Router, type Request, type Response, type NextFunction } from 'express';
import { createCompaniesRepo } from '../repositories/companies';
import { companyFiltersSchema, parseOr400 } from '../utils/validation';
import type { Database } from 'sqlite';
import type { CompanyFilters } from '../types';

export function companiesRoutes(db: Database): Router {
  const router = Router();
  const repo = createCompaniesRepo(db);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = parseOr400(companyFiltersSchema, req.query) as CompanyFilters;
      const result = await repo.listCompanies(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const company = await repo.getCompany(req.params.id as string);
      if (!company) {
        return void res.status(404).json({ error: { code: 'not_found', message: `Company '${req.params.id}' not found` } });
      }
      res.json(company);
    } catch (err) {
      next(err);
    }
  });

  return router;
}