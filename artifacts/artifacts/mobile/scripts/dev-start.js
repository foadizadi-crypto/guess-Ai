#!/usr/bin/env node
/**
 * Cross-platform Expo dev server.
 *
 * Default: Expo Go on a phone (QR + tunnel). Web-only is opt-in because
 * `expo start --web` is what made the game look like it "only works in
 * the browser" — the phone QR then never loads in Expo Go.
 *
 *   pnpm start          → Expo Go (tunnel on Windows)
 *   pnpm start -- --web → browser
 *   EXPO_USE_LAN=1      → skip tunnel (same Wi-Fi, firewall allowing 8081)
 */
const { spawn } = require('child_process');

const port = process.env.PORT || process.env.EXPO_PORT || '8081';
const replitDomain = process.env.REPLIT_DEV_DOMAIN;
const wantWeb = process.argv.includes('--web');

if (replitDomain) {
  process.env.EXPO_PUBLIC_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || replitDomain;
  process.env.EXPO_PUBLIC_REPL_ID = process.env.EXPO_PUBLIC_REPL_ID || process.env.REPL_ID || '';
  if (!process.env.EXPO_PUBLIC_API_URL) {
    process.env.EXPO_PUBLIC_API_URL = `https://${replitDomain}`;
  }
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = replitDomain;
}

if (!process.env.EXPO_PUBLIC_API_URL) {
  process.env.EXPO_PUBLIC_API_URL = 'https://guess-ai-4sqt.onrender.com';
}

const args = ['expo', 'start', '--port', String(port)];
if (wantWeb) {
  args.push('--web');
} else {
  // Custom native modules (AdMob / IAP) make Expo CLI prefer a missing
  // development-build scheme. --go forces the exp:// QR that Expo Go opens.
  args.push('--go');
  if (process.env.EXPO_USE_TUNNEL === '0' || process.env.EXPO_USE_LAN === '1') {
    args.push('--lan');
  } else if (process.env.EXPO_USE_TUNNEL === '1' || process.platform === 'win32') {
    args.push('--tunnel');
  }
}

const child = spawn('pnpm', ['exec', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
