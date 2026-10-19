import express, { type ErrorRequestHandler } from 'express';
import cors, { type CorsOptions } from 'cors';
import { getDatabase, closeDatabase } from './db/database';
import { ensureSeeded } from './db/seed';
import { loadEnv, parseCorsOrigin } from './utils/env';
import { requestLogger } from './middleware/request-logger';
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
  app.use(requestLogger);

  const db = await getDatabase();
  await ensureSeeded();

  app.use('/api/companies', companiesRoutes(db));
  app.use('/api/cities', citiesRoutes(db));
  app.use('/api/providers', providersRoutes(db));
  app.use('/api/assistant', assistantRoutes(db));
  app.use('/api/saved-research', savedResearchRoutes(db));
  app.use('/api/saved-comparisons', savedComparisonsRoutes(db));
  app.use('/api', metaRoutes(db));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = (err as { status?: number }).status ?? 500;
    if (status >= 500) console.error('Unhandled API error:', err);
    res.status(status).json({
      error: {
        code: status === 400 ? 'validation_error' : status === 404 ? 'not_found' : 'internal_error',
        message: err instanceof Error ? err.message : 'Unknown error',
        details: (err as { details?: unknown }).details,
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