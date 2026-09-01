import type { Difficulty } from '@/types';
import { toGameplayDifficulty } from '@/shared/difficulty';
import {
  COUNT_QUICK_ANSWER_OPTIONS,
  COUNT_QUICK_ITEM_COUNT,
  COUNT_QUICK_PALETTES,
  COUNT_QUICK_QUESTIONS,
  COUNT_QUICK_SECONDS,
  COUNT_QUICK_SHAPES,
  type CountQuickPalette,
  type CountQuickShapeId,
} from './config';

export interface CountQuickItem {
  shape: CountQuickShapeId;
  color: string;
}

export interface CountQuickQuestion {
  paletteId: string;
  paletteName: string;
  targetColor: string;
  items: CountQuickItem[];
  options: number[];
  correctCount: number;
}

export function itemCountForDifficulty(difficulty: Difficulty): number {
  return COUNT_QUICK_ITEM_COUNT[toGameplayDifficulty(difficulty)];
}

export function secondsForDifficulty(difficulty: Difficulty): number {
  return COUNT_QUICK_SECONDS[toGameplayDifficulty(difficulty)];
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function pickOne<T>(items: readonly T[]): T {
  const item = items[randomIndex(items.length)];
  if (item === undefined) throw new Error('Count Quick pool is empty');
  return item;
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

function buildOptions(correctCount: number, itemCount: number): number[] {
  const pool: number[] = [];
  for (let n = 0; n <= itemCount; n += 1) {
    if (n !== correctCount) pool.push(n);
  }
  shuffleInPlace(pool);
  const wrongs = pool.slice(0, COUNT_QUICK_ANSWER_OPTIONS - 1);
  const options = shuffleInPlace([correctCount, ...wrongs]);
  if (options.length !== COUNT_QUICK_ANSWER_OPTIONS) {
    throw new Error('Count Quick must have 4 answer options');
  }
  if (new Set(options).size !== COUNT_QUICK_ANSWER_OPTIONS) {
    throw new Error('Count Quick wrong answers must be unique');
  }
  if (!options.includes(correctCount)) {
    throw new Error('Count Quick options must include the correct count');
  }
  return options;
}

export function buildCountQuickQuestion(difficulty: Difficulty): CountQuickQuestion {
  const itemCount = itemCountForDifficulty(difficulty);
  const palette: CountQuickPalette = pickOne(COUNT_QUICK_PALETTES);
  const targetColor = pickOne(palette.colors);
  const items: CountQuickItem[] = [];
  for (let i = 0; i < itemCount; i += 1) {
    items.push({
      shape: pickOne(COUNT_QUICK_SHAPES),
      color: pickOne(palette.colors),
    });
  }
  shuffleInPlace(items);
  const correctCount = items.filter((item) => item.color === targetColor).length;
  return {
    paletteId: palette.id,
    paletteName: palette.name,
    targetColor,
    items,
    options: buildOptions(correctCount, itemCount),
    correctCount,
  };
}

export function buildCountQuickRound(difficulty: Difficulty): CountQuickQuestion[] {
  return Array.from({ length: COUNT_QUICK_QUESTIONS }, () => buildCountQuickQuestion(difficulty));
}
