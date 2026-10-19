/**
 * Central environment-variable validation (Zod).
 *
 * Rules:
 * - The process may only start with variables that parse cleanly; invalid
 *   configuration is a startup failure, never a silent fallback.
 * - `AI_API_KEY` is optional: without it the assistant runs deterministic
 *   demo mode (no external calls).
 * - `CORS_ORIGIN` accepts "*" (open) or a comma-separated allowlist of exact
 *   origins, e.g. "http://localhost:5173,https://gccatlas.example.com".
 */
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce
    .number({ message: 'PORT must be an integer between 1 and 65535' })
    .int()
    .min(1)
    .max(65535)
    .default(4000),
  DB_PATH: z.string().trim().min(1).default(':memory:'),
  CORS_ORIGIN: z.string().trim().min(1).default('*'),
  AI_API_KEY: z.string().trim().min(8).optional(),
  AI_BASE_URL: z.string().url().optional(),
  AI_MODEL: z.string().trim().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export interface ParsedCorsConfig {
  open: boolean;
  origins: string[];
}

export function parseCorsOrigin(raw: string): ParsedCorsConfig {
  const trimmed = raw.trim();
  if (trimmed === '*') return { open: true, origins: [] };
  const origins = trimmed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0 || !origins.every((o) => /^https?:\/\/[\w.-]+(:\d+)?$/.test(o))) {
    throw new Error(
      `Invalid CORS_ORIGIN '${raw}'. Use "*" or a comma-separated list of exact origins like "http://localhost:5173".`,
    );
  }
  return { open: false, origins };
}

let cached: AppEnv | null = null;

/** Validates and caches app env. Throws (fail-fast) on invalid config. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  if (cached) return cached;
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${lines}\nSee .env.example for documented variables.`);
  }
  cached = result.data;
  return cached;
}

/** Test helper: drop the cache so tests can set env vars before loadEnv(). */
export function resetEnvCache(): void {
  cached = null;
}

export function getConfiguredAiMode(env: AppEnv): 'llm' | 'demo' {
  return env.AI_API_KEY ? 'llm' : 'demo';
}
