/**
 * AI Research Assistant — public service surface.
 * Kept as a module folder under services/assistant/ (retrieval, llm, service)
 * to keep the Phase-7 pipeline testable and reviewable piece by piece.
 */
import type { Database } from 'sqlite';

export { createAssistantService } from './assistant/service';
export { AssistantProviderError } from './assistant/llm';
export { createRetrieval } from './assistant/retrieval';
export type { Retrieved } from './assistant/retrieval';
export type { Database } from 'sqlite';
