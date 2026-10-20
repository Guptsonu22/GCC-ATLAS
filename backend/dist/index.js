"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
exports.startServer = startServer;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./db/database");
const seed_1 = require("./db/seed");
const env_1 = require("./utils/env");
const request_logger_1 = require("./middleware/request-logger");
const rate_limit_1 = require("./middleware/rate-limit");
const events_1 = require("./routes/events");
const companies_1 = require("./routes/companies");
const cities_1 = require("./routes/cities");
const providers_1 = require("./routes/providers");
const meta_1 = require("./routes/meta");
const assistant_1 = require("./routes/assistant");
const saved_research_1 = require("./routes/saved-research");
const saved_comparisons_1 = require("./routes/saved-comparisons");
async function createApp() {
    const env = (0, env_1.loadEnv)();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(buildCorsOptions(env.CORS_ORIGIN)));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use((0, request_logger_1.requestLogger)(env.NODE_ENV));
    const db = await (0, database_1.getDatabase)();
    await (0, seed_1.ensureSeeded)();
    // Rate limiting (Phase 6): generous global ceiling + strict tiers on
    // expensive analysis endpoints and anonymous write endpoints. Disabled
    // entirely when NODE_ENV=test.
    const limiters = (0, rate_limit_1.createRateLimiters)(env.NODE_ENV);
    app.use(limiters.global);
    app.use('/api/assistant', limiters.analysis);
    app.use('/api/cities/compare', limiters.analysis);
    app.use('/api/dashboard', limiters.analysis);
    app.use('/api/saved-research', limiters.writes);
    app.use('/api/saved-comparisons', limiters.writes);
    app.use('/api/companies', (0, companies_1.companiesRoutes)(db));
    app.use('/api/cities', (0, cities_1.citiesRoutes)(db));
    app.use('/api/providers', (0, providers_1.providersRoutes)(db));
    app.use('/api/assistant', (0, assistant_1.assistantRoutes)(db));
    app.use('/api/saved-research', (0, saved_research_1.savedResearchRoutes)(db));
    app.use('/api/saved-comparisons', (0, saved_comparisons_1.savedComparisonsRoutes)(db));
    app.use('/api/events', (0, events_1.eventsRoutes)(db, { writes: limiters.writes, analysis: limiters.analysis }));
    app.use('/api', (0, meta_1.metaRoutes)(db));
    app.use((_req, res) => {
        res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
    });
    const errorHandler = (err, _req, res, _next) => {
        const status = err.status ?? 500;
        const assistantCode = err.code;
        const code = assistantCode === 'assistant_provider_error'
            ? 'assistant_provider_error'
            : status === 400
                ? 'validation_error'
                : status === 404
                    ? 'not_found'
                    : 'internal_error';
        if (status >= 500)
            console.error(`API error [${code}]:`, err instanceof Error ? err.message : err);
        res.status(status).json({
            error: {
                code,
                message: err instanceof Error ? err.message : 'Unknown error',
                details: err.details,
                ...(code === 'assistant_provider_error' ? { retryable: err.retryable ?? false } : {}),
            },
        });
    };
    app.use(errorHandler);
    return app;
}
/** "http://a,b" -> exact-origin allowlist; "*" -> open CORS (dev only). */
function buildCorsOptions(raw) {
    const parsed = (0, env_1.parseCorsOrigin)(raw);
    return {
        origin: parsed.open ? true : parsed.origins.length === 1 ? parsed.origins[0] : parsed.origins,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Key'],
        maxAge: 600,
    };
}
async function startServer() {
    const env = (0, env_1.loadEnv)();
    const app = await createApp();
    // Fail-loud instead of silently shipping a wide-open API to production.
    if (env.NODE_ENV === 'production') {
        const parsed = (0, env_1.parseCorsOrigin)(env.CORS_ORIGIN);
        if (parsed.open) {
            console.warn('GCC Atlas production warning: CORS_ORIGIN is not configured — responding to any origin. ' +
                'Set CORS_ORIGIN (e.g. https://your-frontend-host) before public deployment.');
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
        await (0, database_1.closeDatabase)();
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
//# sourceMappingURL=index.js.map