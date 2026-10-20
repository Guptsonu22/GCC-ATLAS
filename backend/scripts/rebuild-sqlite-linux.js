// Rebuilds sqlite3 from source on Linux environments (e.g. Render / Debian 12)
// to prevent "GLIBC_2.38 not found" errors caused by precompiled binaries.
// On non-Linux platforms (e.g. Windows / macOS dev), this is a no-op.

const { execSync } = require('child_process');
const { resolve } = require('path');

if (process.platform === 'linux') {
  console.log('[rebuild-sqlite] Detected Linux platform — rebuilding sqlite3 from source to match system GLIBC...');
  try {
    execSync('npm rebuild sqlite3 --build-from-source', {
      stdio: 'inherit',
      cwd: resolve(__dirname, '..'),
    });
    console.log('[rebuild-sqlite] Successfully rebuilt sqlite3 from source.');
  } catch (err) {
    console.error('[rebuild-sqlite] Error rebuilding sqlite3 from source:', err.message);
    process.exit(1);
  }
} else {
  console.log(`[rebuild-sqlite] Platform is ${process.platform}; skipping source rebuild (using prebuilt binary).`);
}
