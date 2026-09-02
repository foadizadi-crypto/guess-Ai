import {
  SPEED_CARD_COUNT,
  SPEED_CARD_FLASH_MS,
  SPEED_CARD_PALETTE,
  SPEED_CARD_REVEAL_MS,
} from './config';
import {
  assertValidRound,
  buildSpeedCardRound,
  fetchSpeedCardRound,
  revealDurationMs,
} from './engine';
import { speedCardContentLevelCap } from './economy';
import {
  SPEED_CARD_CONTINUE_LABEL,
  SPEED_CARD_COUNTDOWN,
  SPEED_CARD_EXIT_LABEL,
  SPEED_CARD_HOW_TO_BODY,
  SPEED_CARD_HOW_TO_TITLE,
  SPEED_CARD_READY_LABEL,
  SPEED_CARD_START_LABEL,
  SPEED_CARD_WRONG_TITLE,
  speedCardQuestionText,
} from './flow';

function assert(ok: boolean, msg: string): void {
  if (!ok) throw new Error(msg);
}

assert(SPEED_CARD_COUNT === 5, '5 cards');
assert(speedCardContentLevelCap() === 20, 'session cap stays contentLevelCap 20');
assert(SPEED_CARD_FLASH_MS === 500, 'flash stays 500');
assert(SPEED_CARD_HOW_TO_TITLE === 'How to Play', 'how-to title');
assert(
  SPEED_CARD_HOW_TO_BODY === 'Watch the cards carefully and remember their order.',
  'how-to body',
);
assert(SPEED_CARD_READY_LABEL === "I'M READY", 'ready button copy');
assert(SPEED_CARD_COUNTDOWN.join(',') === '3,2,1', 'countdown 3-2-1');
assert(SPEED_CARD_START_LABEL === 'Start', 'start label');
assert(speedCardQuestionText('Purple') === 'Which card was purple?', 'question copy');
assert(SPEED_CARD_WRONG_TITLE === 'WRONG', 'wrong popup title');
assert(SPEED_CARD_CONTINUE_LABEL === 'CONTINUE — AdMob', 'continue copy');
assert(SPEED_CARD_EXIT_LABEL === 'EXIT — Category', 'exit copy');
assert(SPEED_CARD_PALETTE.length === 16, '16-color palette');
assert(SPEED_CARD_REVEAL_MS.easy === 3000, 'easy reveal 3000');
assert(SPEED_CARD_REVEAL_MS.medium === 1500, 'medium reveal 1500');
assert(SPEED_CARD_REVEAL_MS.hard === 500, 'hard reveal 500');
assert(revealDurationMs('easy') === 3000, 'easy duration');
assert(revealDurationMs('medium') === 1500, 'medium duration');
assert(revealDurationMs('hard') === 500, 'hard duration');
assert(revealDurationMs('extra-hard') === 500, 'locked extra-hard uses hard reveal');
assert(revealDurationMs('max') === 500, 'locked max uses hard reveal');

const round = buildSpeedCardRound();
assertValidRound(round);
assert(round.colors.length === SPEED_CARD_COUNT, 'round has 5 cards');
assert(round.questions.length === SPEED_CARD_COUNT, 'round has 5 questions');
assert(new Set(round.colors.map((c) => c.id)).size === SPEED_CARD_COUNT, 'cards unique');
assert(
  round.colors.every((c) => SPEED_CARD_PALETTE.some((p) => p.id === c.id && p.hex === c.hex)),
  'cards use the 16-color palette',
);

let threw = false;
try {
  assertValidRound({
    colors: round.colors,
    questions: [{ id: 'not-a-color', name: 'Nope', hex: '#000000' }, ...round.questions.slice(1)],
  });
} catch {
  threw = true;
}
assert(threw, 'invalid palette color is rejected');

async function mockFetchSpeedCard(
  status: number,
  body: unknown,
): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
  try {
    await fetchSpeedCardRound('easy');
  } catch (err) {
    assert(err instanceof Error, `HTTP ${status} must throw`);
    assert(!String(err).includes('fake success'), 'must not convert failure to success');
    return;
  } finally {
    globalThis.fetch = original;
  }
  throw new Error(`fetchSpeedCardRound should reject HTTP ${status}`);
}

async function runFetchFailureCases(): Promise<void> {
  await mockFetchSpeedCard(400, { error: 'difficulty must be easy, medium, or hard' });
  await mockFetchSpeedCard(502, { error: 'OpenAI Speed Card round failed' });
  await mockFetchSpeedCard(503, { error: 'OPENAI_API_KEY is not configured on the API server' });

  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{not-json', { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
  let malformed = false;
  try {
    await fetchSpeedCardRound('medium');
  } catch {
    malformed = true;
  } finally {
    globalThis.fetch = original;
  }
  assert(malformed, 'malformed 200 body is not treated as a round');

  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ colors: [], questions: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
  let emptyRejected = false;
  try {
    await fetchSpeedCardRound('hard');
  } catch {
    emptyRejected = true;
  } finally {
    globalThis.fetch = original;
  }
  assert(emptyRejected, 'empty palette is not a silent 200 fallback success');
}

runFetchFailureCases()
  .then(() => {
    console.log('speed-card engine smoke ok', {
      count: SPEED_CARD_COUNT,
      palette: SPEED_CARD_PALETTE.length,
      reveal: SPEED_CARD_REVEAL_MS,
    });
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
