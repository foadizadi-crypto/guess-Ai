import type { Difficulty } from '@/types';
import { DIFFICULTY_IDS, isDifficultyOpen } from '@/shared/difficulty';
import { NEW_GAME_IDS } from '@/shared/economy/gameConfigs';

export const CHALLENGE_SLOT_COUNT = 10;

export interface ChallengeModelSlot {
  slot: number;
}

export interface RawChallengeModel {
  difficulty: Difficulty;
  slot: number;
}

export interface RawGameConfig {
  gameId: string;
  difficulties: Record<Difficulty, { open: boolean }>;
  challengeSlots: ChallengeModelSlot[];
  models: RawChallengeModel[];
}

export function buildRawGameConfig(gameId: string): RawGameConfig {
  const difficulties = Object.fromEntries(
    DIFFICULTY_IDS.map((id) => [id, { open: isDifficultyOpen(id) }]),
  ) as Record<Difficulty, { open: boolean }>;

  const challengeSlots: ChallengeModelSlot[] = Array.from(
    { length: CHALLENGE_SLOT_COUNT },
    (_, index) => ({ slot: index + 1 }),
  );

  const models: RawChallengeModel[] = [];
  for (const difficulty of DIFFICULTY_IDS) {
    for (const slot of challengeSlots) {
      models.push({ difficulty, slot: slot.slot });
    }
  }

  return { gameId, difficulties, challengeSlots, models };
}

export const CONFIRMED_MINIGAME_IDS = NEW_GAME_IDS;
