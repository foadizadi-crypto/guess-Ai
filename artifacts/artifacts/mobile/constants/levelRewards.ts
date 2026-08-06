// ─── Level reward table — data-driven, 500 levels ───────────────────────────
// Spec: Final Implementation Prompt §5 (Level Reward Packages)
// Minor reward every 5 levels | Major reward every 10 levels
// If a level is a multiple of 10 it qualifies for BOTH — grant both.
// UI must read from this table — never hardcode rewards in component files.

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
  | 'error_nullifier'   // consumable: next wrong answer won't reduce clarity
  | 'legendary_skin'
  | 'extra_coins';

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
  gems?: number;     // free gem milestone (only at specific levels — see LEVEL_GEM_REWARDS)
  items: RewardItem[];
  packageTier: PackageTier;
  isMinor: boolean;   // qualifies for minor reward (every 5 levels)
  isMajor: boolean;   // qualifies for major reward (every 10 levels)
}

// ─── Tier helpers ─────────────────────────────────────────────────────────────

function tier(level: number): PackageTier {
  if (level <= 100) return 'bronze';
  if (level <= 250) return 'silver';
  if (level <= 400) return 'gold';
  return 'legendary';
}

// ─── Reward schedules by range ────────────────────────────────────────────────
//
//  Range     Minor (every 5)                         Major (every 10)
//  1–100     100 coins + 1 Error Nullifier            1 Simple Frame + 1 Avatar
//  101–250   250 coins + 1 Rare Sticker               1 Game Theme + 1 Silver Badge
//  251–400   400 coins + 1 Title                      Unlock 1 Category + Entrance Effect
//  401–500   600 coins + 1 Legendary Skin Piece       1 Complete Legendary Skin + 1 Animated Frame

function minorCoins(level: number): number {
  if (level <= 100) return 100;
  if (level <= 250) return 250;
  if (level <= 400) return 400;
  return 600;
}

function minorItems(level: number): RewardItem[] {
  if (level <= 100) {
    return [{ type: 'error_nullifier', id: `error_nullifier_l${level}`, label: 'Error Nullifier', quantity: 1 }];
  }
  if (level <= 250) {
    return [{ type: 'rare_sticker', id: `sticker_l${level}`, label: `Rare Sticker #${Math.ceil((level - 100) / 5)}` }];
  }
  if (level <= 400) {
    const titleNum = Math.ceil((level - 250) / 5);
    const TITLES = [
      'Detective', 'Analyst', 'Investigator', 'Observer', 'Scout',
      'Tracker', 'Pathfinder', 'Seeker', 'Explorer', 'Wanderer',
      'Pursuer', 'Discerner', 'Visionary', 'Perceiver', 'Watcher',
      'Sage', 'Oracle', 'Prophet', 'Seer', 'Mystic',
      'Pioneer', 'Trailblazer', 'Voyager', 'Navigator', 'Discoverer',
      'Scholar', 'Maestro', 'Virtuoso', 'Artisan', 'Curator',
    ];
    const title = TITLES[(titleNum - 1) % TITLES.length] ?? 'Legend';
    return [{ type: 'title', id: `title_l${level}_${title.toLowerCase()}`, label: `Title: ${title}` }];
  }
  // 401–500
  const pieceNum = Math.ceil((level - 400) / 5);
  return [{ type: 'skin_piece', id: `legendary_piece_${pieceNum}`, label: `Legendary Skin Piece #${pieceNum}` }];
}

function majorItems(level: number): RewardItem[] {
  const n = Math.floor(level / 10); // unique number for this major level
  if (level <= 100) {
    return [
      { type: 'avatar_frame', id: `frame_simple_${n}`, label: `Simple Frame #${n}` },
      { type: 'avatar',       id: `avatar_l${level}`,  label: `Avatar — Level ${level}` },
    ];
  }
  if (level <= 250) {
    return [
      { type: 'game_theme',   id: `theme_${n}`,        label: `Game Theme #${n - 10}` },
      { type: 'silver_badge', id: `badge_silver_${n}`, label: `Silver Badge #${n - 10}` },
    ];
  }
  if (level <= 400) {
    return [
      { type: 'category_unlock', id: `cat_unlock_l${level}`, label: `Category Unlock — Level ${level}` },
      { type: 'entrance_effect', id: `effect_l${level}`,      label: `Entrance Effect — Level ${level}` },
    ];
  }
  // 401–500
  return [
    { type: 'legendary_skin',  id: `legendary_skin_${n}`,  label: `Complete Legendary Skin #${n - 40}` },
    { type: 'animated_frame',  id: `anim_frame_${n}`,       label: `Animated Frame #${n - 40}` },
  ];
}

// ─── Level gem milestones (mirrored from economy.ts to avoid circular import) ─
const GEM_MILESTONE: Readonly<Record<number, number>> = {
  10: 1, 25: 1, 50: 2, 100: 5, 150: 10, 300: 50, 500: 250,
};

// ─── Build the full 500-level table ──────────────────────────────────────────

function buildLevelRewards(): LevelReward[] {
  const rewards: LevelReward[] = [];

  for (let level = 1; level <= 500; level++) {
    const isMinor = level % 5 === 0;
    const isMajor = level % 10 === 0;

    let coins = 0;
    const items: RewardItem[] = [];

    if (isMinor) {
      coins += minorCoins(level);
      items.push(...minorItems(level));
    }

    if (isMajor) {
      items.push(...majorItems(level));
    }

    const gems = GEM_MILESTONE[level];

    rewards.push({
      level,
      coins,
      ...(gems !== undefined ? { gems } : {}),
      items,
      packageTier: tier(level),
      isMinor,
      isMajor,
    });
  }

  return rewards;
}

export const LEVEL_REWARDS: LevelReward[] = buildLevelRewards();

/** Returns the reward entry for a given level (undefined if no reward at that level). */
export function getLevelReward(level: number): LevelReward | undefined {
  return LEVEL_REWARDS.find(r => r.level === level);
}

/** Returns true if a given level has any reward (minor or major). */
export function hasLevelReward(level: number): boolean {
  return level % 5 === 0 && level >= 5 && level <= 500;
}
