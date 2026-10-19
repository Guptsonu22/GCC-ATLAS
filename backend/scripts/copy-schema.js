// Copies schema.sql into dist/db so the compiled server can find it.
const { copyFileSync, mkdirSync } = require('fs');
const { resolve } = require('path');

const src = resolve(__dirname, '..', 'src', 'db', 'schema.sql');
const dest = resolve(__dirname, '..', 'dist', 'db');
mkdirSync(dest, { recursive: true });
copyFileSync(src, resolve(dest, 'schema.sql'));
console.log('Copied schema.sql to dist/db');
