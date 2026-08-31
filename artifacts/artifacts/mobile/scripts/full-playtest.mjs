/**
 * Online playtest against the live Render API + local asset/route gates.
 * Run: node artifacts/artifacts/mobile/scripts/full-playtest.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const API = 'https://guess-ai-4sqt.onrender.com';

const QUIZ_CATEGORIES = [
  'animals', 'nature', 'food', 'landmarks', 'movies', 'sports', 'technology',
  'art', 'vehicles', 'celebrities', 'history', 'space', 'cities', 'music', 'science',
];

const REQUIRED_ASSETS = [
  'assets/icon/coin.webp',
  'assets/icon/gem.webp',
  'assets/icon/stamina.webp',
  'assets/icon/spinwheel.webp',
  'assets/icon/settings.webp',
  'assets/icon/play.webp',
  'assets/icon/legendary_pack.webp',
  'assets/icon/gem_pack.webp',
  'assets/icon/AdMob_BG.webp',
  'assets/icon/leaderboard.webp',
  'assets/icon/daily-reward.webp',
  'assets/icon/shop.webp',
  'assets/icon/friends.webp',
  'assets/icon/achievement.webp',
  'assets/icon/avatar_pedestal.webp',
  'assets/icon/reveal-blur.webp',
  'assets/icon/skip-question.webp',
  'assets/icon/combo.webp',
  'assets/icon/correct.webp',
  'assets/icon/wrong.webp',
  'assets/icon/profile.webp',
  'assets/icon/score.webp',
  'assets/background/lobby_BG.webp',
  'assets/background/profile_bg.webp',
  'assets/background/customization_BG.webp',
  'assets/background/shop_offer_BG.webp',
  'assets/animations/wave.json',
  'assets/animations/Particles.json',
  'assets/animations/splash.json',
  'assets/images/icon.png',
  'google-services.json',
];

const results = [];

function record(id, ok, detail) {
  results.push({ id, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${id} — ${detail}`);
}

async function fetchJson(url, init = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, ok: res.ok, body };
  } catch (err) {
    const aborted = err?.name === 'AbortError' || controller.signal.aborted;
    return {
      status: 0,
      ok: false,
      body: aborted ? `timeout after ${timeoutMs / 1000}s` : String(err?.message ?? err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonRetry(url, init, timeoutMs, attempts = 2) {
  let last = { status: 0, ok: false, body: 'not attempted' };
  for (let i = 0; i < attempts; i += 1) {
    last = await fetchJson(url, init, timeoutMs);
    if (last.ok) return last;
  }
  return last;
}

function imageKind(url) {
  if (typeof url !== 'string' || url.length < 16) return 'missing';
  if (url.startsWith('data:image/')) return 'data-url';
  if (url.startsWith('https://')) return 'https';
  return 'other';
}

function validateQuizPayload(body) {
  const questions = body?.questions;
  if (!Array.isArray(questions) || questions.length !== 20) {
    return { ok: false, detail: `expected 20 questions, got ${questions?.length ?? 0}` };
  }
  const imageUrl = questions[0]?.imageUrl;
  const kind = imageKind(imageUrl);
  if (kind === 'missing' || kind === 'other') {
    return { ok: false, detail: `bad image (${kind})` };
  }
  if (!questions.every((q) => q.imageUrl === imageUrl)) {
    return { ok: false, detail: 'round is not one-image-per-round' };
  }
  for (const [i, q] of questions.entries()) {
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { ok: false, detail: `q${i} does not have 4 options` };
    }
    const idx = Number(q.correctIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
      return { ok: false, detail: `q${i} has invalid correctIndex` };
    }
    if (q.answer && !q.options.includes(q.answer)) {
      return { ok: false, detail: `q${i} answer is not in options` };
    }
  }
  const meta = body?.meta ? ` providers=${body.meta.textProvider}/${body.meta.imageProvider}` : '';
  return {
    ok: true,
    detail: `20 questions, 4 options, ${kind} image, subject=${body?.meta?.roundSubject ?? questions[0]?.answer}${meta}`,
  };
}

function validateSpeedCard(body) {
  const colors = body?.colors;
  const questions = body?.questions;
  if (!Array.isArray(colors) || colors.length !== 5) {
    return { ok: false, detail: `expected 5 colors, got ${colors?.length ?? 0}` };
  }
  if (!Array.isArray(questions) || questions.length !== 5) {
    return { ok: false, detail: `expected 5 questions, got ${questions?.length ?? 0}` };
  }
  const ids = new Set();
  for (const c of colors) {
    if (!c?.id || !c?.name || !c?.hex) return { ok: false, detail: 'color missing id/name/hex' };
    if (ids.has(c.id)) return { ok: false, detail: `duplicate color ${c.id}` };
    ids.add(c.id);
  }
  const qids = questions.map((q) => q.id);
  if (new Set(qids).size !== 5) return { ok: false, detail: 'duplicate question ids' };
  if (!qids.every((id) => ids.has(id))) {
    return { ok: false, detail: 'question ids do not match cards' };
  }
  const sameOrder = qids.every((id, i) => id === colors[i].id);
  return { ok: true, detail: `5 cards [${[...ids].join(',')}] shuffled=${sameOrder ? 'no' : 'yes'}` };
}

async function main() {
  console.log(`Playtest against ${API}\n`);

  const missing = REQUIRED_ASSETS.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
  record('assets.required', missing.length === 0, missing.length === 0
    ? `${REQUIRED_ASSETS.length} bundling assets present`
    : `missing: ${missing.join(', ')}`);

  const root = await fetchJson(`${API}/`, {}, 45_000);
  record('api.root', root.ok && root.body?.status === 'ok', `HTTP ${root.status}`);

  const health = await fetchJson(`${API}/api/healthz`, {}, 45_000);
  record('api.healthz', health.ok && health.body?.status === 'ok', `HTTP ${health.status}`);

  const ai = await fetchJson(`${API}/api/ai-status`, {}, 45_000);
  const openaiOn = Boolean(ai.body?.openaiConfigured && ai.body?.text?.[0]?.configured);
  record('api.ai-status', ai.ok && openaiOn, openaiOn
    ? `OpenAI configured, mode=${ai.body?.aiMode}`
    : JSON.stringify(ai.body)?.slice(0, 200));

  const config = await fetchJson(`${API}/api/config`, {}, 45_000);
  record('api.config', config.ok, `HTTP ${config.status}`);

  const board = await fetchJson(`${API}/api/leaderboard?type=global&limit=5`, {}, 45_000);
  record('api.leaderboard', board.ok && Array.isArray(board.body), `HTTP ${board.status} rows=${Array.isArray(board.body) ? board.body.length : '?'}`);

  const skipQuiz = new Set((process.env.SKIP_QUIZ || '').split(',').map((s) => s.trim()).filter(Boolean));

  for (let i = 1; i <= 2; i += 1) {
    const started = Date.now();
    const res = await fetchJsonRetry(`${API}/api/speed-card/round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }, 120_000);
    const elapsed = `${Math.round((Date.now() - started) / 1000)}s`;
    if (!res.ok) {
      record(`speedcard.round${i}`, false, `HTTP ${res.status} ${JSON.stringify(res.body)?.slice(0, 180)} (${elapsed})`);
      continue;
    }
    const check = validateSpeedCard(res.body);
    record(`speedcard.round${i}`, check.ok, `${check.detail} (${elapsed})`);
  }

  for (const category of QUIZ_CATEGORIES) {
    if (skipQuiz.has(category)) {
      record(`quiz.${category}`, true, 'skipped (already passed this session)');
      continue;
    }
    const difficulty = category === 'animals' ? 'easy' : category === 'nature' ? 'medium' : 'hard';
    const started = Date.now();
    const res = await fetchJsonRetry(`${API}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, difficulty, count: 20 }),
    }, 240_000);
    const elapsed = `${Math.round((Date.now() - started) / 1000)}s`;
    if (!res.ok) {
      record(`quiz.${category}`, false, `HTTP ${res.status} ${JSON.stringify(res.body)?.slice(0, 180)} (${elapsed})`);
      continue;
    }
    const check = validateQuizPayload(res.body);
    record(`quiz.${category}`, check.ok, `${check.detail} (${elapsed})`);
  }

  const sourceChecks = [
    ['flow.quizFinishToResult', 'app/game.tsx', "router.replace(ROUTES.RESULT)"],
    ['flow.quizExitToLobby', 'app/game.tsx', "router.replace(ROUTES.LOBBY)"],
    ['flow.quizPauseExit', 'components/PauseMenu.tsx', 'Exit to Lobby'],
    ['flow.resultHomeToLobby', 'app/result.tsx', "router.replace(ROUTES.LOBBY)"],
    ['flow.resultPlayAgain', 'app/result.tsx', "router.replace(ROUTES.LEVEL_SELECT)"],
    ['flow.speedFinishToResult', 'games/speed-card/SpeedCardScreen.tsx', "router.replace(ROUTES.RESULT)"],
    ['flow.speedReadyNoToLobby', 'games/speed-card/SpeedCardScreen.tsx', 'handleReadyNo'],
    ['flow.speedExitToLobby', 'games/speed-card/SpeedCardScreen.tsx', "router.replace(ROUTES.LOBBY)"],
    ['flow.categoryStartQuiz', 'app/category-select.tsx', 'ROUTES.GAME'],
    ['flow.categoryStartSpeed', 'app/category-select.tsx', 'ROUTES.SPEED_CARD'],
    ['flow.lobbyPlay', 'app/lobby.tsx', 'ROUTES.LEVEL_SELECT'],
    ['auth.guestButton', 'app/login.tsx', 'Continue as Guest'],
    ['auth.guestSignIn', 'services/authService.ts', 'signInAnonymously'],
    ['auth.linkKeepsUid', 'services/authService.ts', 'linkWithCredential'],
    ['auth.duplicateGoogleBlocked', 'services/authService.ts', 'already_in_use'],
    ['auth.shopIapGoogleGate', 'app/shop.tsx', 'ensureGoogleForIap'],
    ['auth.deleteProgressWarning', 'app/settings.tsx', 'Real-money purchase records'],
    ['auth.purchaseLedgerWrite', 'services/firestoreService.ts', 'purchase_ledger'],
    ['auth.apiAllowsGuest', '../api-server/src/lib/verifyAuth.ts', '"anonymous"'],
    ['auth.apiKeepsPurchases', '../api-server/src/routes/account.ts', 'purchasesRetained'],
    ['auth.rulesPurchaseLedger', '../../../firestore.rules', 'purchase_ledger'],
    ['auth.guardAllowsGuest', 'app/_layout.tsx', 'isSignedInPlayer'],
  ];
  for (const [id, rel, needle] of sourceChecks) {
    const filePath = path.join(ROOT, rel);
    if (!fs.existsSync(filePath)) {
      record(id, false, `missing file ${rel}`);
      continue;
    }
    const text = fs.readFileSync(filePath, 'utf8');
    record(id, text.includes(needle), text.includes(needle) ? `${rel} contains ${needle}` : `${rel} missing ${needle}`);
  }

  const accountSrc = fs.readFileSync(path.join(ROOT, '../api-server/src/routes/account.ts'), 'utf8');
  const deletesLedger = accountSrc.includes('deleteMatchingDocuments("purchase_ledger"');
  record(
    'auth.apiNeverDeletesLedger',
    !deletesLedger,
    deletesLedger ? 'account delete still targets purchase_ledger' : 'account delete does not touch purchase_ledger',
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed, ${failed.length} failed`);
  if (failed.length) {
    for (const f of failed) console.log(`  - ${f.id}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
