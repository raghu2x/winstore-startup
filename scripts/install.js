// The native addon is Windows-only. On other platforms skip the build entirely;
// index.js falls back to a JS stub that rejects with a clear message.
if (process.platform !== 'win32') {
  process.exit(0);
}

const { spawnSync } = require('node:child_process');

// Resolve node-gyp-build's entry script rather than relying on node_modules/.bin
// being on PATH, so this works when invoked directly as well as via npm.
const cli = require.resolve('node-gyp-build/bin.js');

const result = spawnSync(process.execPath, [cli], { stdio: 'inherit' });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
