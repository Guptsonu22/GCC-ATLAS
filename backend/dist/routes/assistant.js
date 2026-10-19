"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assistantRoutes = assistantRoutes;
const express_1 = require("express");
const assistant_1 = require("../services/assistant");
const validation_1 = require("../utils/validation");
function assistantRoutes(db) {
    const router = (0, express_1.Router)();
    const service = (0, assistant_1.createAssistantService)(db);
    router.get('/status', (_req, res) => {
        const hasKey = Boolean(process.env.AI_API_KEY);
        res.json({
            ai_configured: hasKey,
            mode: hasKey ? 'llm' : 'deterministic-demo',
            description: hasKey
                ? 'LLM mode: answers are generated server-side using retrieved dataset evidence, with citations.'
                : 'Demo mode: no AI key configured. Answers are composed deterministically from the local dataset. Configure AI_API_KEY on the server to enable LLM mode.',
        });
    });
    router.post('/query', async (req, res, next) => {
        try {
            const input = (0, validation_1.parseOr400)(validation_1.assistantSchema, req.body);
            res.json(await service.answer(input));
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=assistant.js.map