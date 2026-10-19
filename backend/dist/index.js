"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./db/database");
const seed_1 = require("./db/seed");
const companies_1 = require("./routes/companies");
const cities_1 = require("./routes/cities");
const providers_1 = require("./routes/providers");
const meta_1 = require("./routes/meta");
const assistant_1 = require("./routes/assistant");
const saved_research_1 = require("./routes/saved-research");
async function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || '*' }));
    app.use(express_1.default.json({ limit: '1mb' }));
    const db = await (0, database_1.getDatabase)();
    await (0, seed_1.ensureSeeded)();
    app.use('/api/companies', (0, companies_1.companiesRoutes)(db));
    app.use('/api/cities', (0, cities_1.citiesRoutes)(db));
    app.use('/api/providers', (0, providers_1.providersRoutes)(db));
    app.use('/api/assistant', (0, assistant_1.assistantRoutes)(db));
    app.use('/api/saved-research', (0, saved_research_1.savedResearchRoutes)(db));
    app.use('/api', (0, meta_1.metaRoutes)(db));
    app.use((_req, res) => {
        res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
    });
    const errorHandler = (err, _req, res, _next) => {
        const status = err.status ?? 500;
        if (status >= 500)
            console.error('Unhandled API error:', err);
        res.status(status).json({
            error: {
                code: status === 400 ? 'validation_error' : status === 404 ? 'not_found' : 'internal_error',
                message: err instanceof Error ? err.message : 'Unknown error',
                details: err.details,
            },
        });
    };
    app.use(errorHandler);
    return app;
}
async function startServer() {
    const app = await createApp();
    const port = Number(process.env.PORT) || 4000;
    const server = app.listen(port, () => {
        console.log(`GCC Atlas API listening on http://localhost:${port}`);
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