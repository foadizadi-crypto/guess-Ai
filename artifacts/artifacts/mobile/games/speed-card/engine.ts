import type { Difficulty } from '@/types';
import { getApiUrl } from '@/services/apiConfig';
import { toGameplayDifficulty } from '@/shared/difficulty';
import {
  SPEED_CARD_COUNT,
  SPEED_CARD_FLASH_MS,
  SPEED_CARD_PALETTE,
  SPEED_CARD_PALETTE_IDS,
  SPEED_CARD_REVEAL_MS,
} from '@/games/speed-card/config';

export { SPEED_CARD_COUNT, SPEED_CARD_FLASH_MS };

export interface SpeedCardColor {
  id: string;
  name: string;
  hex: string;
}

export function revealDurationMs(difficulty: Difficulty): number {
  return SPEED_CARD_REVEAL_MS[toGameplayDifficulty(difficulty)];
}

export function paletteSwatchById(id: string): SpeedCardColor | undefined {
  const swatch = SPEED_CARD_PALETTE.find((color) => color.id === id);
  if (!swatch) return undefined;
  return { id: swatch.id, name: swatch.name, hex: swatch.hex };
}

export interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Place cards in a centered 3+2 grid. Positions never overlap.
 * If the board is too small, every card is scaled down by the same factor.
 */
export function layoutCardPositions(
  count: number,
  boardWidth: number,
  boardHeight: number,
  cardWidth: number,
  cardHeight: number,
): CardRect[] {
  const pad = 12;
  const gap = 12;
  const innerW = Math.max(1, boardWidth - pad * 2);
  const innerH = Math.max(1, boardHeight - pad * 2);
  const rowPattern = count === SPEED_CARD_COUNT ? [3, 2] : [count];
  const rows = rowPattern.length;
  const maxCols = Math.max(...rowPattern);
  const scale = Math.min(
    1,
    innerW / (maxCols * cardWidth + Math.max(0, maxCols - 1) * gap),
    innerH / (rows * cardHeight + Math.max(0, rows - 1) * gap),
  );
  const width = Math.max(36, Math.floor(cardWidth * scale));
  const height = Math.max(48, Math.floor(cardHeight * scale));

  const totalH = rows * height + Math.max(0, rows - 1) * gap;
  let y = pad + (innerH - totalH) / 2;
  const placed: CardRect[] = [];
  let remaining = count;

  for (const cols of rowPattern) {
    const n = Math.min(cols, remaining);
    const rowW = n * width + Math.max(0, n - 1) * gap;
    let x = pad + (innerW - rowW) / 2;
    for (let i = 0; i < n; i += 1) {
      placed.push({ x, y, width, height });
      x += width + gap;
    }
    y += height + gap;
    remaining -= n;
  }

  return placed;
}

export interface SpeedCardRound {
  colors: SpeedCardColor[];
  questions: SpeedCardColor[];
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = items[i];
    const swap = items[j];
    if (current === undefined || swap === undefined) continue;
    items[i] = swap;
    items[j] = current;
  }
  return items;
}

function hydrateIds(ids: string[]): SpeedCardColor[] {
  return ids.map((rawId) => {
    const swatch = paletteSwatchById(rawId.trim().toLowerCase());
    if (!swatch) throw new Error(`Speed Card color "${rawId}" is not in the 16-color palette`);
    return swatch;
  });
}

function isPermutation(colors: SpeedCardColor[], questions: SpeedCardColor[]): boolean {
  if (colors.length !== questions.length) return false;
  const a = [...colors.map((c) => c.id)].sort();
  const b = [...questions.map((c) => c.id)].sort();
  return a.every((id, index) => id === b[index]);
}

export function assertValidRound(round: SpeedCardRound): SpeedCardRound {
  if (round.colors.length !== SPEED_CARD_COUNT || round.questions.length !== SPEED_CARD_COUNT) {
    throw new Error('Speed Card round must have 5 cards and 5 questions');
  }
  const colorIds = new Set(round.colors.map((c) => c.id));
  if (colorIds.size !== SPEED_CARD_COUNT) {
    throw new Error('Speed Card round has duplicate colors');
  }
  if (!round.colors.every((c) => paletteSwatchById(c.id))) {
    throw new Error('Speed Card round uses a color outside the 16-color palette');
  }
  if (!isPermutation(round.colors, round.questions)) {
    throw new Error('Speed Card questions must be the same colors as the cards');
  }
  return {
    colors: hydrateIds(round.colors.map((c) => c.id)),
    questions: hydrateIds(round.questions.map((c) => c.id)),
  };
}

/** Build one round from the confirmed 16-color palette (same shape as the API). */
export function buildSpeedCardRound(): SpeedCardRound {
  const pool = shuffleInPlace([...SPEED_CARD_PALETTE_IDS]);
  const colorIds = pool.slice(0, SPEED_CARD_COUNT);
  const questionIds = shuffleInPlace([...colorIds]);
  if (questionIds.length > 1 && questionIds.every((id, index) => id === colorIds[index])) {
    const first = questionIds.shift();
    if (first !== undefined) questionIds.push(first);
  }
  return assertValidRound({
    colors: hydrateIds(colorIds),
    questions: hydrateIds(questionIds),
  });
}

export async function fetchSpeedCardRound(difficulty: Difficulty): Promise<SpeedCardRound> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), 60_000);
  try {
    const response = await fetch(getApiUrl('/api/speed-card/round'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: toGameplayDifficulty(difficulty) }),
      signal: controller?.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? `Speed Card API responded with ${response.status}`);
    }
    const data = (await response.json()) as SpeedCardRound;
    return assertValidRound(data);
  } catch (err) {
    if (__DEV__) {
      console.warn('[Speed Card] API failed — using local round in development', err);
      return buildSpeedCardRound();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
