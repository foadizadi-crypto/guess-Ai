import type { Difficulty } from '@/types';
import { toGameplayDifficulty } from '@/shared/difficulty';
import OpenAIService from '@/services/OpenAIService';
import {
  LOST_ITEM_ANSWER_OPTIONS,
  LOST_ITEM_IMAGE_STYLE,
  LOST_ITEM_LOCATIONS,
  LOST_ITEM_PHASE_MS,
  LOST_ITEM_QUESTIONS,
  LOST_ITEM_SETS,
  type LostItemLocation,
  type LostItemSet,
} from './config';

export interface LostItemOption {
  id: string;
  label: string;
  thumbPrompt: string;
}

export interface LostItemPlan {
  setId: string;
  scene: string;
  missingItem: string;
  location: LostItemLocation;
  scenePrompt: string;
  editPrompt: string;
  options: LostItemOption[];
  correctIndex: number;
}

export interface LostItemQuestion extends LostItemPlan {
  sceneUrl: string;
  missingUrl: string;
  optionUrls: string[];
}

export function phaseMsForDifficulty(difficulty: Difficulty): number {
  return LOST_ITEM_PHASE_MS[toGameplayDifficulty(difficulty)];
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function pickOne<T>(items: readonly T[]): T {
  const item = items[randomIndex(items.length)];
  if (item === undefined) throw new Error('Lost Item pool is empty');
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

function pickDistinct(items: readonly string[], count: number): string[] {
  if (items.length < count) {
    throw new Error('Lost Item set does not have enough items');
  }
  return shuffleInPlace([...items]).slice(0, count);
}

function setsForDifficulty(difficulty: Difficulty): LostItemSet[] {
  const tier = toGameplayDifficulty(difficulty);
  return LOST_ITEM_SETS.filter((set) => set.difficulty === tier);
}

function thumbPrompt(item: string): string {
  return `A single ${item}, one object only, centered, matching the same 3D polished cartoon chibi toy style, plain simple background, no other objects, no text`;
}

export function planLostItemQuestion(difficulty: Difficulty): LostItemPlan {
  const set = pickOne(setsForDifficulty(difficulty));
  const location = pickOne(LOST_ITEM_LOCATIONS);
  const optionItems = pickDistinct(set.items, LOST_ITEM_ANSWER_OPTIONS);
  const missingItem = pickOne(optionItems);
  const listedItems = set.items.join(', ');
  const scenePrompt =
    `${set.scene}. The scene must include all of these objects: ${listedItems}. ` +
    `Place the ${missingItem} at the ${location}. ` +
    `Keep a consistent 3D chibi toy world, same camera, same lighting. No text.`;
  const editPrompt =
    `Keep this exact same 3D polished cartoon chibi scene, camera, lighting, colors, and every other object. ` +
    `Remove only the ${missingItem} at the ${location}. ` +
    `Reconstruct the background and nearby surfaces so that object was never there. ` +
    `No hole, no blank patch, no crop, no repeated texture, no smudge, and no outline of the missing object.`;
  const options = shuffleInPlace(
    optionItems.map((label) => ({
      id: label,
      label,
      thumbPrompt: thumbPrompt(label),
    })),
  );
  const correctIndex = options.findIndex((option) => option.id === missingItem);
  if (correctIndex < 0) {
    throw new Error('Lost Item options must include the missing item');
  }
  return {
    setId: set.id,
    scene: set.scene,
    missingItem,
    location,
    scenePrompt,
    editPrompt,
    options,
    correctIndex,
  };
}

export function planLostItemRound(difficulty: Difficulty): LostItemPlan[] {
  return Array.from({ length: LOST_ITEM_QUESTIONS }, () => planLostItemQuestion(difficulty));
}

export async function hydrateLostItemQuestion(plan: LostItemPlan): Promise<LostItemQuestion> {
  const images = await OpenAIService.getInstance().generateLostItemImages({
    scenePrompt: plan.scenePrompt,
    editPrompt: plan.editPrompt,
    optionPrompts: plan.options.map((option) => option.thumbPrompt),
    style: LOST_ITEM_IMAGE_STYLE,
  });
  if (!images.editedUrl) {
    throw new Error('Lost Item edit image is missing');
  }
  if (images.optionUrls.length !== LOST_ITEM_ANSWER_OPTIONS) {
    throw new Error('Lost Item must have 4 thumbnail options');
  }
  return {
    ...plan,
    sceneUrl: images.url,
    missingUrl: images.editedUrl,
    optionUrls: images.optionUrls,
  };
}

export async function buildLostItemQuestion(difficulty: Difficulty): Promise<LostItemQuestion> {
  return hydrateLostItemQuestion(planLostItemQuestion(difficulty));
}
