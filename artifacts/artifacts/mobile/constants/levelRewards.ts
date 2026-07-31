// ─── Level reward table — data-driven, 100 levels ───────────────────────────
// Every level earns coins. Milestone levels earn additional named rewards.
// UI must read from this table — never hardcode rewards in component files.
// Reward packages: Bronze (1-30) | Silver (31-60) | Gold (61-90) | Legendary (91-100)

export type RewardItemType =
  | 'coins'
  | 'avatar_frame'
  | 'title'
  | 'skin'
  | 'badge'
  | 'crown'
  | 'category_unlock'
  | 'avatar'
  | 'animated_frame'
  | 'extra_coins';

export interface RewardItem {
  type: RewardItemType;
  id: string;
  label: string;
}

export type PackageTier = 'bronze' | 'silver' | 'gold' | 'legendary';

export interface LevelReward {
  level: number;
  coins: number;
  items: RewardItem[];
  packageTier: PackageTier;
}

function tier(level: number): PackageTier {
  if (level <= 30)  return 'bronze';
  if (level <= 60)  return 'silver';
  if (level <= 90)  return 'gold';
  return 'legendary';
}

function baseCoins(level: number): number {
  if (level <= 30)  return 100;
  if (level <= 60)  return 150;
  if (level <= 90)  return 200;
  return 300;
}

// Milestone levels that earn extra coins on top of baseCoins
const MILESTONE_EXTRA_COINS: Record<number, number> = {
  10: 200, 20: 200, 25: 200, 30: 200,
  40: 200, 50: 200, 60: 200, 70: 200,
  75: 200, 80: 200, 90: 200, 100: 300,
};

// Milestone items keyed by level
const MILESTONE_ITEMS: Record<number, RewardItem[]> = {
  5:   [{ type: 'avatar_frame',   id: 'frame_bronze',       label: 'Bronze Avatar Frame' }],
  10:  [{ type: 'title',          id: 'title_beginner',     label: 'Title: Beginner Guesser' },
        { type: 'avatar',         id: 'avatar_bonus_1',     label: 'Bonus Avatar' }],
  15:  [{ type: 'extra_coins',    id: 'bonus_500',          label: '+500 Bonus Coins' }],
  20:  [{ type: 'skin',           id: 'skin_dark',          label: 'New Theme Skin' }],
  25:  [{ type: 'badge',          id: 'badge_25',           label: 'Silver Badge' }],
  30:  [{ type: 'crown',          id: 'crown_bronze',       label: 'Bronze Crown' }],
  40:  [{ type: 'category_unlock',id: 'cat_vintage_movies', label: 'New Category: Vintage Movies' }],
  50:  [{ type: 'avatar_frame',   id: 'frame_silver',       label: 'Silver Frame' },
        { type: 'title',          id: 'title_observer',     label: 'Exclusive Title' }],
  60:  [{ type: 'avatar',         id: 'avatar_premium_1',   label: 'Premium Avatar' }],
  70:  [{ type: 'extra_coins',    id: 'bonus_1500',         label: '+1500 Bonus Coins' }],
  75:  [{ type: 'badge',          id: 'badge_75',           label: 'Special Gold Badge' }],
  80:  [{ type: 'category_unlock',id: 'cat_mystery',        label: 'New Category: Mystery Objects' }],
  90:  [{ type: 'animated_frame', id: 'frame_animated_90',  label: 'Animated Profile Frame' }],
  100: [{ type: 'crown',          id: 'crown_legendary',    label: 'Legendary Crown' },
        { type: 'title',          id: 'title_legendary',    label: 'Title: Blur Master' },
        { type: 'skin',           id: 'skin_legendary',     label: 'Exclusive Legendary Skin' },
        { type: 'animated_frame', id: 'frame_legendary',    label: 'Animated Legendary Frame' }],
};

function buildLevelRewards(): LevelReward[] {
  const rewards: LevelReward[] = [];
  for (let level = 1; level <= 100; level++) {
    const extraCoins = MILESTONE_EXTRA_COINS[level] ?? 0;
    const milestoneItems = MILESTONE_ITEMS[level] ?? [];

    // Extra-coins items get converted to actual coins; remove them from items list
    // and fold into the coins total
    const realItems = milestoneItems.filter(i => i.type !== 'extra_coins');
    const extraCoinItems = milestoneItems.filter(i => i.type === 'extra_coins');
    const extraFromItems = extraCoinItems.reduce((sum, item) => {
      // e.g. id='bonus_500' → 500 coins
      const match = item.id.match(/bonus_(\d+)/);
      return sum + (match ? parseInt(match[1]!, 10) : 0);
    }, 0);

    rewards.push({
      level,
      coins: baseCoins(level) + extraCoins + extraFromItems,
      items: realItems,
      packageTier: tier(level),
    });
  }
  return rewards;
}

export const LEVEL_REWARDS: LevelReward[] = buildLevelRewards();

export function getLevelReward(level: number): LevelReward | undefined {
  return LEVEL_REWARDS.find(r => r.level === level);
}
