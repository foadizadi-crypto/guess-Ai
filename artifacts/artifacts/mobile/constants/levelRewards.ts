// ─── Level reward table — spec v1.0.0 ────────────────────────────────────────
//
// SINGLE SOURCE OF TRUTH for all 500 level rewards.
//
// Schedule (from spec):
//   Levels   1–100  every 5 levels:  50 coins
//   Levels   1–100  every 10 levels: +100 coins + Error Nullifier  (stacks with 5-level)
//   Levels 101–250  every 5 levels:  100 coins + Rare Sticker
//   Levels 101–250  every 10 levels: +250 coins + Silver Badge     (stacks with 5-level)
//   Levels 251–400  every 5 levels:  200 coins + Legendary Skin Piece
//   Levels 251–400  every 10 levels: +500 coins + Game Theme       (stacks with 5-level)
//   Levels 401–500  every 5 levels:  300 coins + Legendary Skin Piece
//   Levels 401–500  every 10 levels: +700 coins + Animated Frame   (stacks with 5-level)
//
// SPECIAL rewards (BOTH recurring AND special are granted — spec: "If a level
// qualifies for both a recurring reward and a special reward, BOTH must be granted"):
//   L10:  +200 coins + Fox Avatar
//   L50:  +500 coins + Astronaut Avatar
//   L100: +1 000 coins + Dragon Avatar
//   L200: +2 000 coins + Legend Avatar
//   L300: +3 000 coins + 1 500 XP bonus + Golden Theme + Time Boost
//   L400: +4 000 coins + 2 000 XP bonus + Diamond Frame + 2x Multiplier
//   L500:  Crown + Legendary Title + Golden Skin + Particle Effect + MAX LEVEL Badge
//          (plus the recurring 401–500 reward)
//
// Gems are not granted from level rewards (Shop IAP + the one spin jackpot only).
// ─────────────────────────────────────────────────────────────────────────────

export type RewardItemType =
  | 'coins'
  | 'avatar'
  | 'avatar_frame'
  | 'animated_frame'
  | 'title'
  | 'skin'
  | 'skin_piece'
  | 'badge'
  | 'silver_badge'
  | 'crown'
  | 'rare_sticker'
  | 'game_theme'
  | 'entrance_effect'
  | 'category_unlock'
  | 'error_nullifier'
  | 'legendary_skin'
  | 'extra_coins'
  | 'consumable'
  | 'particle_effect';

export interface RewardItem {
  type: RewardItemType;
  id: string;
  label: string;
  quantity?: number;
}

export type PackageTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface LevelReward {
  level: number;
  coins: number;
  /** Always 0 — gems are not a level reward. */
  gems: number;
  /** Bonus XP granted at this level (only at major special levels 300/400). */
  bonusXP?: number;
  items: RewardItem[];
  packageTier: PackageTier;
  isMinor: boolean;  // qualifies for minor reward (every 5 levels)
  isMajor: boolean;  // qualifies for major reward (every 10 levels)
  isSpecial: boolean; // has a special milestone reward on top
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tier(level: number): PackageTier {
  if (level <= 100) return 'bronze';
  if (level <= 250) return 'silver';
  if (level <= 400) return 'gold';
  return 'legendary';
}

// ─── Special milestone definitions ────────────────────────────────────────────

interface SpecialReward {
  coins: number;
  bonusXP?: number;
  items: RewardItem[];
}

const SPECIAL: Readonly<Record<number, SpecialReward>> = {
  10: {
    coins: 200,
    items: [{ type: 'avatar', id: 'avatar_3', label: 'Daveigh Avatar' }],
  },
  50: {
    coins: 500,
    items: [{ type: 'avatar', id: 'avatar_7', label: 'Linda Avatar' }],
  },
  100: {
    coins: 1_000,
    items: [{ type: 'avatar', id: 'avatar_9', label: 'Patty Avatar' }],
  },
  200: {
    coins: 2_000,
    items: [{ type: 'avatar', id: 'avatar_10', label: 'Sissy Avatar' }],
  },
  300: {
    coins: 3_000,
    bonusXP: 1_500,
    items: [
      { type: 'game_theme',  id: 'theme_golden',   label: 'Golden Theme'  },
      { type: 'consumable',  id: 'time_boost',      label: 'Time Boost',    quantity: 1 },
    ],
  },
  400: {
    coins: 4_000,
    bonusXP: 2_000,
    items: [
      { type: 'avatar_frame', id: 'frame_6_diamond', label: 'Diamond Frame'  },
      { type: 'consumable',   id: 'multiplier_2x',   label: '2× Multiplier', quantity: 1 },
    ],
  },
  500: {
    coins: 0,
    items: [
      { type: 'crown',          id: 'crown_legendary',          label: 'Crown'             },
      { type: 'title',          id: 'title_legendary',          label: 'Legendary Title'   },
      { type: 'legendary_skin', id: 'skin_golden',              label: 'Golden Skin'       },
      { type: 'particle_effect',id: 'particle_level500',        label: 'Particle Effect'   },
      { type: 'badge',          id: 'badge_max_level',          label: 'MAX LEVEL Badge'   },
    ],
  },
};

// ─── Recurring reward helpers ─────────────────────────────────────────────────

/** Minor (every-5-level) coins for the range the level falls in. */
function minorCoins(level: number): number {
  if (level <= 100)  return 50;
  if (level <= 250)  return 100;
  if (level <= 400)  return 200;
  return 300;
}

/** Major (every-10-level) extra coins stacked on top of minorCoins. */
function majorExtraCoins(level: number): number {
  if (level <= 100)  return 100;
  if (level <= 250)  return 250;
  if (level <= 400)  return 500;
  return 700;
}

function minorItems(level: number): RewardItem[] {
  if (level <= 100) return [];  // no item on minor levels in 1-100 range
  if (level <= 250) {
    return [{
      type: 'rare_sticker',
      id: `sticker_l${level}`,
      label: `Rare Sticker #${Math.ceil((level - 100) / 5)}`,
    }];
  }
  // 251-400 and 401-500 both give Legendary Skin Piece at every-5
  const pieceNum = level <= 400
    ? Math.ceil((level - 250) / 5)
    : Math.ceil((level - 400) / 5) + 30;
  return [{
    type: 'skin_piece',
    id: `legendary_piece_${pieceNum}`,
    label: `Legendary Skin Piece #${pieceNum}`,
  }];
}

function majorItems(level: number): RewardItem[] {
  if (level <= 100) {
    return [{ type: 'error_nullifier', id: 'error_nullifier', label: 'Error Nullifier', quantity: 1 }];
  }
  if (level <= 250) {
    const n = Math.floor(level / 10) - 10;
    return [{ type: 'silver_badge', id: `badge_silver_l${level}`, label: `Silver Badge #${n}` }];
  }
  if (level <= 400) {
    const n = Math.floor(level / 10) - 25;
    return [{ type: 'game_theme', id: `theme_l${level}`, label: `Game Theme #${n}` }];
  }
  // 401-500
  const n = Math.floor(level / 10) - 40;
  return [{ type: 'animated_frame', id: `anim_frame_l${level}`, label: `Animated Frame #${n}` }];
}

// ─── Build the full 500-level table ──────────────────────────────────────────

function buildLevelRewards(): LevelReward[] {
  const rewards: LevelReward[] = [];

  for (let level = 1; level <= 500; level++) {
    const isMinor   = level % 5 === 0;
    const isMajor   = level % 10 === 0;
    const special   = SPECIAL[level];
    const isSpecial = !!special;

    let coins = 0;
    let gems = 0;
    const items: RewardItem[] = [];
    let bonusXP: number | undefined;

    if (isMinor) {
      coins += minorCoins(level);
      items.push(...minorItems(level));
    }
    if (isMajor) {
      coins += majorExtraCoins(level);
      items.push(...majorItems(level));
    }
    if (isSpecial) {
      coins += special.coins;
      items.push(...special.items);
      if (special.bonusXP) bonusXP = special.bonusXP;
    }

    if (coins > 0 || gems > 0 || items.length > 0 || isSpecial) {
      rewards.push({
        level,
        coins,
        gems,
        ...(bonusXP !== undefined ? { bonusXP } : {}),
        items,
        packageTier: tier(level),
        isMinor,
        isMajor,
        isSpecial,
      });
    }
  }

  return rewards;
}

export const LEVEL_REWARDS: LevelReward[] = buildLevelRewards();

/** Returns the reward entry for a given level (undefined if no reward at that level). */
export function getLevelReward(level: number): LevelReward | undefined {
  return LEVEL_REWARDS.find((r) => r.level === level);
}

/** Returns true if a given level has any reward. */
export function hasLevelReward(level: number): boolean {
  return LEVEL_REWARDS.some((r) => r.level === level);
}
