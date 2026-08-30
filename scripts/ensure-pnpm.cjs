#!/usr/bin/env node
/**
 * Cross-platform preinstall guard. Replaces the Replit `sh -c` script that
 * fails on Windows because `sh` is not available.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
for (const lockfile of ['package-lock.json', 'yarn.lock']) {
  const full = path.join(root, lockfile);
  try {
    fs.unlinkSync(full);
  } catch {
    // File is absent — nothing to remove.
  }
}

const ua = process.env.npm_config_user_agent || '';
if (!ua.includes('pnpm/')) {
  console.error('Use pnpm instead of npm or yarn.');
  process.exit(1);
}
