import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

function json429(message: string): { error: { code: string; message: string } } {
  return { error: { code: 'rate_limited', message } };
}

const handler: RequestHandler = (_req: Request, res: Response) => {
  res.status(429).json(json429('Too many requests — please pause before trying again.'));
};

export interface RateLimiterConfig {
  /** Global limiter: generous ceiling to stop runaway clients. */
  global: RequestHandler;
  /** Expensive deterministic-analysis endpoints (assistant, stats, compare). */
  analysis: RequestHandler;
  /** Write endpoints (saved research, event ingest). */
  writes: RequestHandler;
}

/**
 * Builds the three-tier limiter set. Disabled entirely under NODE_ENV=test so
 * automated suites stay deterministic; production tiers read env overrides:
 *   RATE_LIMIT_WINDOW_MS / RATE_LIMIT_GLOBAL_MAX / RATE_LIMIT_ANALYSIS_MAX / RATE_LIMIT_WRITES_MAX
 * Memory store only — horizontal scale deployments must swap redis-store in
 * (documented in architecture/api-contract.md).
 */
export function createRateLimiters(envNodeEnv: string): RateLimiterConfig {
  if (envNodeEnv === 'test') {
    const pass: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => next();
    return { global: pass, analysis: pass, writes: pass };
  }

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
  const opts = {
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,
  } as const;

  return {
    global: rateLimit({
      ...opts,
      limit: Number(process.env.RATE_LIMIT_GLOBAL_MAX ?? 600),
      handler: (_req: Request, res: Response) => res.status(429).json(json429('Too many requests — slow down and retry shortly.')),
    }),
    analysis: rateLimit({ ...opts, limit: Number(process.env.RATE_LIMIT_ANALYSIS_MAX ?? 40), handler }),
    writes: rateLimit({ ...opts, limit: Number(process.env.RATE_LIMIT_WRITES_MAX ?? 60), handler }),
  };
}
