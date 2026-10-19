import { Router, type Request, type Response, type NextFunction } from 'express';
import { createAssistantService } from '../services/assistant';
import { assistantSchema, parseOr400 } from '../utils/validation';
import type { Database } from 'sqlite';

export function assistantRoutes(db: Database): Router {
  const router = Router();
  const service = createAssistantService(db);

  router.get('/status', (_req: Request, res: Response) => {
    const hasKey = Boolean(process.env.AI_API_KEY);
    res.json({
      ai_configured: hasKey,
      mode: hasKey ? 'llm' : 'deterministic-demo',
      description: hasKey
        ? 'LLM mode: answers are generated server-side using retrieved dataset evidence, with citations.'
        : 'Demo mode: no AI key configured. Answers are composed deterministically from the local dataset. Configure AI_API_KEY on the server to enable LLM mode.',
    });
  });

  router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = parseOr400(assistantSchema, req.body);
      res.json(await service.answer(input));
    } catch (err) {
      next(err);
    }
  });

  return router;
}