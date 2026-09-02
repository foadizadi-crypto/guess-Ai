import { getXpRequiredForLevel } from './levelRequirements';

export interface ProgressionState {
  level: number;
  xp: number;
  levelsGained: number;
}

/**
 * Apply gained XP onto global level. Content level of a minigame is not used here.
 */
export function applyXp(currentLevel: number, currentXp: number, gainedXp: number): ProgressionState {
  const safeGain = Number.isFinite(gainedXp) ? Math.max(0, Math.round(gainedXp)) : 0;
  let level = Number.isFinite(currentLevel) && currentLevel >= 1 ? Math.floor(currentLevel) : 1;
  let xp = Number.isFinite(currentXp) ? Math.max(0, currentXp) : 0;
  xp += safeGain;

  let levelsGained = 0;
  let safety = 500;
  while (safety-- > 0) {
    const need = getXpRequiredForLevel(level);
    if (need <= 0 || xp < need) break;
    xp -= need;
    level += 1;
    levelsGained += 1;
  }

  return { level, xp, levelsGained };
}
