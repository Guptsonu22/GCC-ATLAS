"use strict";
/**
 * AI Research Assistant — public service surface.
 * Kept as a module folder under services/assistant/ (retrieval, llm, service)
 * to keep the Phase-7 pipeline testable and reviewable piece by piece.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRetrieval = exports.AssistantProviderError = exports.createAssistantService = void 0;
var service_1 = require("./assistant/service");
Object.defineProperty(exports, "createAssistantService", { enumerable: true, get: function () { return service_1.createAssistantService; } });
var llm_1 = require("./assistant/llm");
Object.defineProperty(exports, "AssistantProviderError", { enumerable: true, get: function () { return llm_1.AssistantProviderError; } });
var retrieval_1 = require("./assistant/retrieval");
Object.defineProperty(exports, "createRetrieval", { enumerable: true, get: function () { return retrieval_1.createRetrieval; } });
//# sourceMappingURL=assistant.js.map