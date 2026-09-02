import { IN_GAME_RETRY_ADS_PER_DAY } from '@/constants/economy';

export type RestartGate = 'stamina' | 'retry-ad' | 'blocked';

export function restartGate(energy: number, staminaCost: number, retryAdsUsedToday: number): RestartGate {
  if (energy >= staminaCost) return 'stamina';
  if (retryAdsUsedToday < IN_GAME_RETRY_ADS_PER_DAY) return 'retry-ad';
  return 'blocked';
}
