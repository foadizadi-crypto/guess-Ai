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
}

function overlaps(a: CardRect, b: CardRect, width: number, height: number, gap: number): boolean {
  return !(
    a.x + width + gap < b.x
    || b.x + width + gap < a.x
    || a.y + height + gap < b.y
    || b.y + height + gap < a.y
  );
}

export function layoutCardPositions(
  count: number,
  boardWidth: number,
  boardHeight: number,
  cardWidth: number,
  cardHeight: number,
): CardRect[] {
  const pad = 10;
  const gap = 8;
  const maxX = Math.max(pad, boardWidth - cardWidth - pad);
  const maxY = Math.max(pad, boardHeight - cardHeight - pad);
  const placed: CardRect[] = [];

  for (let i = 0; i < count; i += 1) {
    let next: CardRect = { x: pad, y: pad };
    for (let attempt = 0; attempt < 60; attempt += 1) {
      next = {
        x: pad + Math.random() * Math.max(0, maxX - pad),
        y: pad + Math.random() * Math.max(0, maxY - pad),
      };
      if (!placed.some((rect) => overlaps(rect, next, cardWidth, cardHeight, gap))) {
        break;
      }
    }
    placed.push(next);
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
