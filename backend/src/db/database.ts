import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '..', '..', 'data', 'gcc-atlas.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  database.exec(schema);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}