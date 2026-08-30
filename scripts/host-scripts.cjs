#!/usr/bin/env node
/**
 * Render auto-detects `pnpm run build` / `pnpm start` from the repo root.
 * Root build otherwise typechecks and builds every workspace package, including
 * the Expo app (scripts/build.js), which needs a Replit domain and fails on Render.
 */
'use strict';

const { spawnSync } = require('child_process');

const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const mode = process.argv[2];

function runPnpm(args) {
  const result = spawnSync('pnpm', args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  const code = result.status === null ? 1 : result.status;
  if (code !== 0) process.exit(code);
}

if (mode === 'build') {
  if (isRender) {
    runPnpm(['--filter', '@workspace/api-server', 'run', 'build']);
    process.exit(0);
  }
  runPnpm(['run', 'typecheck']);
  runPnpm(['-r', '--if-present', 'run', 'build']);
  process.exit(0);
}

if (mode === 'start') {
  if (isRender) {
    runPnpm(['--filter', '@workspace/api-server', 'run', 'start']);
    process.exit(0);
  }
  runPnpm(['--filter', '@workspace/mobile', 'run', 'dev']);
  process.exit(0);
}

console.error('Usage: node scripts/host-scripts.cjs <build|start>');
process.exit(1);
