import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { getDatabase, closeDatabase } from './db/database';
import { ensureSeeded } from './db/seed';
import { companiesRoutes } from './routes/companies';
import { citiesRoutes } from './routes/cities';
import { providersRoutes } from './routes/providers';
import { metaRoutes } from './routes/meta';
import { assistantRoutes } from './routes/assistant';
import { savedResearchRoutes } from './routes/saved-research';

export async function createApp(): Promise<express.Express> {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json({ limit: '1mb' }));

  const db = await getDatabase();
  await ensureSeeded();

  app.use('/api/companies', companiesRoutes(db));
  app.use('/api/cities', citiesRoutes(db));
  app.use('/api/providers', providersRoutes(db));
  app.use('/api/assistant', assistantRoutes(db));
  app.use('/api/saved-research', savedResearchRoutes(db));
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

export async function startServer(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT) || 4000;
  const server = app.listen(port, () => {
    console.log(`GCC Atlas API listening on http://localhost:${port}`);
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