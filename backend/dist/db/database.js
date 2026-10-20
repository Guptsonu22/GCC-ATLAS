"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.initializeSchema = initializeSchema;
exports.closeDatabase = closeDatabase;
exports.newId = newId;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const fs_1 = require("fs");
const path_1 = require("path");
let db = null;
/**
 * SQLite is used for the prototype. NOTE: better-sqlite3 was preferred but
 * failed to compile on this Windows machine (no MSVC build tools), so we use
 * the `sqlite3` driver behind the promise-based `sqlite` wrapper instead.
 * The repository layer keeps SQL isolated so migration to PostgreSQL is possible.
 */
function resolveWritableDbPath(requestedPath) {
    const preferred = requestedPath || (0, path_1.resolve)(process.cwd(), 'data', 'gcc-atlas.db');
    if (preferred === ':memory:')
        return preferred;
    const candidates = [
        preferred,
        (0, path_1.resolve)(process.cwd(), 'data', 'gcc-atlas.db'),
        (0, path_1.resolve)('/tmp', 'gcc-atlas.db'),
    ];
    for (const candidate of candidates) {
        const dir = (0, path_1.resolve)(candidate, '..');
        try {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
            return candidate;
        }
        catch (err) {
            const code = err?.code;
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
async function getDatabase() {
    if (!db) {
        const dbPath = resolveWritableDbPath(process.env.DB_PATH);
        console.log(`[gcc-atlas-api] Connecting to database at: ${dbPath}`);
        db = await (0, sqlite_1.open)({ filename: dbPath, driver: sqlite3_1.default.Database });
        await db.exec('PRAGMA foreign_keys = ON;');
        await initializeSchema(db);
    }
    return db;
}
async function initializeSchema(database) {
    const schemaPath = findSchemaPath();
    const schema = (0, fs_1.readFileSync)(schemaPath, 'utf-8');
    await database.exec(schema);
}
function findSchemaPath() {
    const candidates = [
        (0, path_1.resolve)(__dirname, 'schema.sql'),
        (0, path_1.resolve)(__dirname, '../../src/db/schema.sql'),
        (0, path_1.resolve)(process.cwd(), 'src/db/schema.sql'),
    ];
    for (const candidate of candidates) {
        if ((0, fs_1.existsSync)(candidate))
            return candidate;
    }
    throw new Error(`schema.sql not found; tried: ${candidates.join(', ')}`);
}
async function closeDatabase() {
    if (db) {
        await db.close();
        db = null;
    }
}
function newId(prefix) {
    const raw = globalThis.crypto.randomUUID();
    return `${prefix}_${raw.replace(/-/g, '').slice(0, 12)}`;
}
//# sourceMappingURL=database.js.map