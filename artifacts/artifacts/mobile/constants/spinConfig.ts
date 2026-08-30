/**
 * spinConfig.ts — Jackpot Spin Wheel configuration (Phase 3)
 *
 * Single source of truth for all spin wheel economy values.
 * Update ONLY this file to change rewards, probabilities, costs, or limits —
 * no core game logic changes required.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpinRewardType = 'coins' | 'gems' | 'consumable' | 'cosmetic' | 'jackpot';

export interface SpinReward {
  id:          string;
  label:       string;
  type:        SpinRewardType;
  /** Base reward amount (coins / gems / consumable count) */
  amount:      number;
  /** For consumable rewards — the consumable ID to grant */
  itemId?:     string;
  /** Probability weight 0–100; all entries must sum to 100 */
  probability: number;
  /** Wheel segment background color */
  color:       string;
  /** Ionicons icon name */
  icon:        string;
  isJackpot?:  boolean;
}

export interface SpinWheelConfig {
  /** Coin cost for an extra (paid) spin */
  extraSpinCost:         number;
  /** Maximum paid spins per calendar day */
  extraSpinsPerDay:      number;
  /** Hours between free spins */
  freeSpinCooldownHours: number;
  /** Multiplier applied to base reward on a Jackpot landing */
  jackpotMultiplier:     number;
  /** Maximum coins awarded on Jackpot (economy safety cap) */
  jackpotMaxReward:      number;
  /** Ordered reward pool — probabilities MUST sum to 100 */
  rewards:               readonly SpinReward[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const SPIN_CONFIG: SpinWheelConfig = {
  extraSpinCost:         100,
  extraSpinsPerDay:      5,
  freeSpinCooldownHours: 24,
  jackpotMultiplier:     5,
  jackpotMaxReward:      10_000,

  // Total probability = 100% (validated below)
  rewards: [
    {
      id:          'coins_50',
      label:       '50 Coins',
      type:        'coins',
      amount:      50,
      probability: 27,
      color:       '#F9A825',
      icon:        'logo-bitcoin',
    },
    {
      id:          'coins_100',
      label:       '100 Coins',
      type:        'coins',
      amount:      100,
      probability: 22,
      color:       '#FFD740',
      icon:        'logo-bitcoin',
    },
    {
      id:          'error_nullifier',
      label:       'Error Null.',
      type:        'consumable',
      amount:      1,
      itemId:      'error_nullifier',
      probability: 14,
      color:       '#EF5350',
      icon:        'shield-checkmark-outline',
    },
    {
      id:          'time_boost',
      label:       'Time Boost',
      type:        'consumable',
      amount:      1,
      itemId:      'time_boost',
      probability: 10,
      color:       '#42A5F5',
      icon:        'timer-outline',
    },
    // Economy v2: small gem faucet so free players can taste the gem economy
    // (stamina source upgrades) and are more likely to convert to buyers.
    {
      id:          'gems_2',
      label:       '2 Gems',
      type:        'gems',
      amount:      2,
      probability: 9,
      color:       '#B39DDB',
      icon:        'diamond-outline',
    },
    {
      id:          'gems_5',
      label:       '5 Gems',
      type:        'gems',
      amount:      5,
      probability: 8,
      color:       '#CE93D8',
      icon:        'diamond-outline',
    },
    {
      id:          'rare_sticker',
      label:       'Rare Sticker',
      type:        'cosmetic',
      amount:      1,
      itemId:      'spin_rare_sticker',
      probability: 5,
      color:       '#FF7043',
      icon:        'star-outline',
    },
    {
      id:          'coins_500',
      label:       '500 Coins',
      type:        'coins',
      amount:      500,
      probability: 3,
      color:       '#FFA000',
      icon:        'logo-bitcoin',
    },
    {
      id:          'jackpot',
      label:       'JACKPOT!',
      type:        'jackpot',
      // Base coin value; the store pays min(amount × jackpotMultiplier, jackpotMaxReward).
      amount:      500,
      probability: 2,
      color:       '#FF1744',
      icon:        'flash',
      isJackpot:   true,
    },
  ],
} as const;

// Fail loudly in development if the wheel probabilities ever stop summing to 100 —
// a silent drift here quietly changes the whole reward economy.
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const total = SPIN_CONFIG.rewards.reduce((sum, r) => sum + r.probability, 0);
  if (total !== 100) {
    console.warn(`[spinConfig] probabilities sum to ${total}, expected 100`);
  }
}

/** Coins paid out for a jackpot landing, with the economy safety cap applied. */
export function jackpotPayout(baseAmount: number): number {
  return Math.min(baseAmount * SPIN_CONFIG.jackpotMultiplier, SPIN_CONFIG.jackpotMaxReward);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Weighted random pick — returns the index of the winning reward slot.
 * Uses the `probability` field of each entry as the weight.
 */
export function pickRewardIndex(rewards: readonly SpinReward[]): number {
  const total = rewards.reduce((sum, r) => sum + r.probability, 0);
  let   rand  = Math.random() * total;
  for (let i = 0; i < rewards.length; i++) {
    rand -= rewards[i].probability;
    if (rand <= 0) return i;
  }
  return rewards.length - 1;
}

/**
 * Returns the number of additional degrees the wheel must rotate
 * so that segment `index` lands directly under the top pointer.
 *
 * The top pointer sits at 270° in SVG space (12 o'clock).
 * Segments are laid out clockwise starting at 0° (3 o'clock).
 */
export function angleForSegment(index: number, segmentCount: number): number {
  const segDeg  = 360 / segmentCount;
  const center  = index * segDeg + segDeg / 2;  // mid-angle of segment
  let   target  = (270 - center) % 360;
  if (target < 0) target += 360;
  return target;
}
