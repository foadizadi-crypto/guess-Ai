import { xpToAdvanceLevel } from '@/constants/gameConfig';

/**
 * XP required to go from `level` to `level + 1`.
 * Same formula as live player progression (`userStore.addXP` → `xpToAdvanceLevel`):
 * Round(GAME_CONFIG.xp_base_formula_coefficient × N ^ xp_base_formula_exponent)
 * currently 1.2 × N^1.4.
 *
 * The previous Curve B (100 × N^1.25) is removed — it was never used by addXP.
 */
export function getXpRequiredForLevel(level: number): number {
  const n = Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1;
  return xpToAdvanceLevel(n);
}
