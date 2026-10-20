import { Router, type Request, type Response, type NextFunction } from 'express';
import type { RequestHandler } from 'express';
import { createEventsRepo, EVENT_NAMES } from '../repositories/events';
import { z } from 'zod';

const eventSchema = z.object({
  name: z.enum(EVENT_NAMES),
  properties: z
    .record(z.string(), z.string().max(200))
    .refine((r) => Object.keys(r).length <= 8, 'properties may carry at most 8 keys')
    .optional(),
});

/**
 * Usage instrumentation (PRD §3.5). POST ingest is fire-per-request but cheap;
 * the aggregate summary is the Phase-2 KPI read. No raw session keys are ever
 * stored — only a truncated hash.
 */
export function eventsRoutes(
  db: Parameters<typeof createEventsRepo>[0],
  limiters: { writes: RequestHandler; analysis: RequestHandler },
) {
  const router = Router();
  const repo = createEventsRepo(db);

  router.post('/', limiters.writes, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = eventSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'validation_error',
            message: 'Invalid event payload',
            details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          },
        });
        return;
      }
      await repo.record(parsed.data.name, parsed.data.properties ?? {}, req.headers['x-session-key']);
      res.status(202).json({ accepted: true });
    } catch (err) {
      next(err);
    }
  });

  router.get('/summary', limiters.analysis, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await repo.summary());
    } catch (err) {
      next(err);
    }
  });

  router.get('/names', (_req: Request, res: Response) => {
    res.json({ data: EVENT_NAMES });
  });

  return router;
}
