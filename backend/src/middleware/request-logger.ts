import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Minimal structured request logger. Skipped when NODE_ENV=test so test
 * output stays clean. Emits one line per finished request:
 *   [gcc-atlas-api] GET /api/companies 200 12ms
 */
export function requestLogger(envNodeEnv: string): RequestHandler {
  if (envNodeEnv === 'test') {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  return (req: Request, res: Response, next: NextFunction) => {
    const started = process.hrtime.bigint();
    const finish = (status: number) => {
      const ms = Number(process.hrtime.bigint() - started) / 1_000_000;
      const line = `[gcc-atlas-api] ${req.method} ${req.originalUrl} ${status} ${ms.toFixed(1)}ms`;
      if (status >= 500) console.error(line);
      else console.log(line);
    };
    res.on('finish', () => finish(res.statusCode));
    next();
  };
}
