import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

let db: Database | null = null;

/**
 * SQLite is used for the prototype. NOTE: better-sqlite3 was preferred but
 * failed to compile on this Windows machine (no MSVC build tools), so we use
 * the `sqlite3` driver behind the promise-based `sqlite` wrapper instead.
 * The repository layer keeps SQL isolated so migration to PostgreSQL is possible.
 */
function resolveWritableDbPath(requestedPath?: string): string {
  const preferred = requestedPath || resolve(process.cwd(), 'data', 'gcc-atlas.db');
  if (preferred === ':memory:') return preferred;

  const candidates = [
    preferred,
    resolve(process.cwd(), 'data', 'gcc-atlas.db'),
    resolve('/tmp', 'gcc-atlas.db'),
  ];

  for (const candidate of candidates) {
    const dir = resolve(candidate, '..');
    try {
      mkdirSync(dir, { recursive: true });
      return candidate;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'EACCES' || code === 'EPERM' || code === 'EROFS') {
        console.warn(`[gcc-atlas-api] Notice: Cannot write to "${dir}" (${code}). Trying fallback candidate...`);
        continue;
      }
      throw err;
    }
  }

  console.warn('[gcc-atlas-api] Warning: All filesystem paths unwritable; falling back to in-memory database.');
  return ':memory:';
}

export async function getDatabase(): Promise<Database> {
  if (!db) {
    const dbPath = resolveWritableDbPath(process.env.DB_PATH);
    console.log(`[gcc-atlas-api] Connecting to database at: ${dbPath}`);
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.exec('PRAGMA foreign_keys = ON;');
    await initializeSchema(db);
  }
  return db;
}

export async function initializeSchema(database: Database): Promise<void> {
  const schemaPath = findSchemaPath();
  const schema = readFileSync(schemaPath, 'utf-8');
  await database.exec(schema);
}

function findSchemaPath(): string {
  const candidates = [
    resolve(__dirname, 'schema.sql'),
    resolve(__dirname, '../../src/db/schema.sql'),
    resolve(process.cwd(), 'src/db/schema.sql'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`schema.sql not found; tried: ${candidates.join(', ')}`);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

export function newId(prefix: string): string {
  const raw = globalThis.crypto.randomUUID();
  return `${prefix}_${raw.replace(/-/g, '').slice(0, 12)}`;
}
