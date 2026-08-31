import type { Difficulty } from '@/types';
import { getApiUrl } from '@/services/apiConfig';

export const SPEED_CARD_COUNT = 5;
export const SPEED_CARD_FLASH_MS = 500;

export interface SpeedCardColor {
  id: string;
  name: string;
  hex: string;
}

export function revealDurationMs(difficulty: Difficulty): number {
  if (difficulty === 'easy') return 3000;
  if (difficulty === 'medium') return 1500;
  return 500;
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
  const rowPattern = count === 5 ? [3, 2] : [count];
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

export async function fetchSpeedCardRound(): Promise<SpeedCardRound> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), 60_000);
  try {
    const response = await fetch(getApiUrl('/api/speed-card/round'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller?.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? `Speed Card API responded with ${response.status}`);
    }
    const data = (await response.json()) as SpeedCardRound;
    const valid = (item: SpeedCardColor | undefined): item is SpeedCardColor =>
      Boolean(item && item.id && item.name && item.hex);
    if (!Array.isArray(data.colors) || data.colors.length !== SPEED_CARD_COUNT || !data.colors.every(valid)) {
      throw new Error('Speed Card API returned an invalid color set');
    }
    if (!Array.isArray(data.questions) || data.questions.length !== SPEED_CARD_COUNT || !data.questions.every(valid)) {
      throw new Error('Speed Card API returned invalid questions');
    }
    const colorIds = new Set(data.colors.map((c) => c.id));
    if (colorIds.size !== SPEED_CARD_COUNT) {
      throw new Error('Speed Card API returned duplicate colors');
    }
    if (!data.questions.every((q) => colorIds.has(q.id))) {
      throw new Error('Speed Card API returned questions that do not match the cards');
    }
    return data;
  } catch (error) {
    if (controller?.signal.aborted) {
      throw new Error('Speed Card API timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
