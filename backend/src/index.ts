import 'dotenv/config';
import express, { type ErrorRequestHandler, type Request, type Response, type NextFunction } from 'express';
import cors, { type CorsOptions } from 'cors';
import { getDatabase, closeDatabase } from './db/database';
import { ensureSeeded } from './db/seed';
import { loadEnv, parseCorsOrigin } from './utils/env';
import { requestLogger } from './middleware/request-logger';
import { createRateLimiters } from './middleware/rate-limit';
import { eventsRoutes } from './routes/events';
import { companiesRoutes } from './routes/companies';
import { citiesRoutes } from './routes/cities';
import { providersRoutes } from './routes/providers';
import { metaRoutes } from './routes/meta';
import { assistantRoutes } from './routes/assistant';
import { savedResearchRoutes } from './routes/saved-research';
import { savedComparisonsRoutes } from './routes/saved-comparisons';

export async function createApp(): Promise<express.Express> {
  const env = loadEnv();
  const app = express();
  app.use(cors(buildCorsOptions(env.CORS_ORIGIN)));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger(env.NODE_ENV));

  const db = await getDatabase();
  await ensureSeeded();

  // Rate limiting (Phase 6): generous global ceiling + strict tiers on
  // expensive analysis endpoints and anonymous write endpoints. Disabled
  // entirely when NODE_ENV=test.
  const limiters = createRateLimiters(env.NODE_ENV);
  app.use(limiters.global);
  app.use('/api/assistant', limiters.analysis);
  app.use('/api/cities/compare', limiters.analysis);
  app.use('/api/dashboard', limiters.analysis);
  app.use('/api/saved-research', limiters.writes);
  app.use('/api/saved-comparisons', limiters.writes);

  app.use('/api/companies', companiesRoutes(db));
  app.use('/api/cities', citiesRoutes(db));
  app.use('/api/providers', providersRoutes(db));
  app.use('/api/assistant', assistantRoutes(db));
  app.use('/api/saved-research', savedResearchRoutes(db));
  app.use('/api/saved-comparisons', savedComparisonsRoutes(db));
  app.use('/api/events', eventsRoutes(db, { writes: limiters.writes, analysis: limiters.analysis }));
  app.use('/api', metaRoutes(db));

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
  });

  const errorHandler: ErrorRequestHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as { status?: number }).status ?? 500;
    const assistantCode = (err as { code?: string }).code;
    const code =
      assistantCode === 'assistant_provider_error'
        ? 'assistant_provider_error'
        : status === 400
          ? 'validation_error'
          : status === 404
            ? 'not_found'
            : 'internal_error';
    if (status >= 500) console.error(`API error [${code}]:`, err instanceof Error ? err.message : err);
    res.status(status).json({
      error: {
        code,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: (err as { details?: unknown }).details,
        ...(code === 'assistant_provider_error' ? { retryable: (err as { retryable?: boolean }).retryable ?? false } : {}),
      },
    });
  };
  app.use(errorHandler);

  return app;
}

/** "http://a,b" -> exact-origin allowlist; "*" -> open CORS (dev only). */
function buildCorsOptions(raw: string): CorsOptions {
  const parsed = parseCorsOrigin(raw);
  return {
    origin: parsed.open ? true : parsed.origins.length === 1 ? parsed.origins[0] : parsed.origins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Key'],
    maxAge: 600,
  };
}

export async function startServer(): Promise<void> {
  const env = loadEnv();
  const app = await createApp();
  // Fail-loud instead of silently shipping a wide-open API to production.
  if (env.NODE_ENV === 'production') {
    const parsed = parseCorsOrigin(env.CORS_ORIGIN);
    if (parsed.open) {
      console.warn(
        'GCC Atlas production warning: CORS_ORIGIN is not configured — responding to any origin. ' +
          'Set CORS_ORIGIN (e.g. https://your-frontend-host) before public deployment.',
      );
    }
    if (env.DB_PATH === ':memory:') {
      console.warn('GCC Atlas production warning: DB_PATH is ":memory:" — all writes are lost on restart.');
    }
  }
  const server = app.listen(env.PORT, () => {
    const mode = env.AI_API_KEY ? 'llm' : 'demo';
    console.log(`GCC Atlas API listening on http://localhost:${env.PORT} (env: ${env.NODE_ENV}, assistant: ${mode})`);
  });

  const shutdown = async () => {
    server.close();
    await closeDatabase();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}