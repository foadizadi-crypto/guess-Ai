import { SESSION_ROUNDS } from './constants';

/** Move a config knob from the selected difficulty toward the hard value across 20 rounds. */
export function lerpByRound(start: number, end: number, round: number, total = SESSION_ROUNDS): number {
  if (total <= 1) return end;
  const t = Math.min(1, Math.max(0, (round - 1) / (total - 1)));
  return start + (end - start) * t;
}
