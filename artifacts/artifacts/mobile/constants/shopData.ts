// ─── GUESSAi Shop Inventory — data-driven ────────────────────────────────────
// Spec: Final Implementation Prompt §6 (Shop System)
// All items are defined here. Shop UI must read from these arrays — never
// hardcode items inside UI component files.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Currency types ────────────────────────────────────────────────────────

export type CurrencyType = 'coins' | 'gems' | 'real_money';

// ─── Consumable items (bought with coins) ─────────────────────────────────

export type ConsumableId =
  | 'clarity_bomb'       // removes 15% blur instantly — usable mid-session
  | 'combo_shield'       // wrong answer drops combo 1 tier instead of full reset
  | 'time_boost'         // +20 seconds to session timer (next session)
  | 'multiplier_2x'      // 2× coins & XP for next 3 complete sessions
  | 'error_nullifier';   // next wrong answer won't reduce image clarity

export interface ConsumableItem {
  id: ConsumableId;
  name: string;
  description: string;
  price: number;
  currency: 'coins';
  useTiming: 'before_session' | 'mid_session';
}

export const CONSUMABLE_ITEMS: ConsumableItem[] = [
  {
    id: 'clarity_bomb',
    name: 'Clarity Bomb',
    description: 'Removes 15% of current blur instantly. Can be used mid-session.',
    price: 200,
    currency: 'coins',
    useTiming: 'mid_session',
  },
  {
    id: 'combo_shield',
    name: 'Combo Shield',
    description: 'On a wrong answer, your combo drops by only 1 tier instead of fully resetting.',
    price: 150,
    currency: 'coins',
    useTiming: 'before_session',
  },
  {
    id: 'time_boost',
    name: 'Time Boost',
    description: 'Adds 20 seconds to the session timer for your next session.',
    price: 100,
    currency: 'coins',
    useTiming: 'before_session',
  },
  {
    id: 'multiplier_2x',
    name: '2× Multiplier',
    description: 'Doubles Coins & XP earned for the next 3 complete sessions.',
    price: 300,
    currency: 'coins',
    useTiming: 'before_session',
  },
  {
    id: 'error_nullifier',
    name: 'Error Nullifier',
    description: 'Your next wrong answer will NOT reduce image clarity. Single use.',
    price: 200,
    currency: 'coins',
    useTiming: 'before_session',
  },
];

// ─── Utility items (coins or gems) ────────────────────────────────────────

export interface UtilityItem {
  id: string;
  name: string;
  description: string;
  coinPrice: number;
  gemPrice: number;
}

export const UTILITY_ITEMS: UtilityItem[] = [
  {
    id: 'early_category_unlock',
    name: 'Early Category Unlock',
    description: 'Permanently unlock any locked category regardless of your level.',
    coinPrice: 1000,
    gemPrice: 50,
  },
];

// ─── Gem-only cosmetics ───────────────────────────────────────────────────

export type CosmeticCategory = 'rare_frame' | 'environment_theme' | 'entrance_effect' | 'sticker_pack';

export interface GemCosmeticItem {
  id: string;
  name: string;
  description: string;
  category: CosmeticCategory;
  gemPrice: number;
}

export const GEM_COSMETIC_ITEMS: GemCosmeticItem[] = [
  // Rare frames (20–150 gems)
  { id: 'frame_golden',     name: 'Golden Frame',     description: 'A shimmering golden profile frame.', category: 'rare_frame', gemPrice: 20 },
  { id: 'frame_dynamic',    name: 'Dynamic Frame',    description: 'An animated dynamic profile frame.', category: 'rare_frame', gemPrice: 150 },
  { id: 'frame_neon',       name: 'Neon Frame',       description: 'A glowing neon profile frame.',      category: 'rare_frame', gemPrice: 60 },
  { id: 'frame_cosmic',     name: 'Cosmic Frame',     description: 'A cosmic star-dust animated frame.', category: 'rare_frame', gemPrice: 120 },

  // Environment themes (80 gems)
  { id: 'theme_night',      name: 'Night City',       description: 'Changes lobby and game board to a neon night-city theme.', category: 'environment_theme', gemPrice: 80 },
  { id: 'theme_ocean',      name: 'Deep Ocean',       description: 'A serene deep-ocean underwater theme.', category: 'environment_theme', gemPrice: 80 },
  { id: 'theme_space',      name: 'Outer Space',      description: 'A galactic space environment theme.',   category: 'environment_theme', gemPrice: 80 },

  // Entrance effects (40 gems)
  { id: 'effect_lightning', name: 'Lightning Entry',  description: 'Lightning bolt burst when your session starts.', category: 'entrance_effect', gemPrice: 40 },
  { id: 'effect_fire',      name: 'Fire Entry',       description: 'Flames surround your avatar on entry.', category: 'entrance_effect', gemPrice: 40 },
  { id: 'effect_confetti',  name: 'Confetti Burst',   description: 'A confetti explosion on session start.', category: 'entrance_effect', gemPrice: 40 },

  // Sticker / emoji packs (30 gems)
  { id: 'stickers_classic', name: 'Classic Emoji Pack', description: '20 classic emojis for result reactions and chat.', category: 'sticker_pack', gemPrice: 30 },
  { id: 'stickers_animals', name: 'Animal Emoji Pack',  description: '20 animal emojis for result reactions and chat.', category: 'sticker_pack', gemPrice: 30 },
];

// ─── Real-money special offers ────────────────────────────────────────────

export interface RealMoneyOffer {
  id: string;
  name: string;
  description: string;
  price: string; // formatted USD
  contents: string[];
  oneTime?: boolean;
  future?: boolean;   // not yet available
}

export const REAL_MONEY_OFFERS: RealMoneyOffer[] = [
  {
    id: 'starter_pack',
    name: 'Starter Pack',
    description: 'The best deal to kick off your GUESSAi journey.',
    price: '$2.00',
    contents: ['5× Combo Shield', '3× Clarity Bomb', '1× Exclusive Silver Frame'],
    oneTime: true,
  },
  {
    id: 'season_pass',
    name: 'Season Pass',
    description: 'Seasonal reward track with exclusive cosmetics. Coming soon.',
    price: '$5.00',
    contents: ['Seasonal reward track', 'Exclusive cosmetics', 'Season badge'],
    future: true,
  },
];

// ─── Ad-removal products ──────────────────────────────────────────────────

export interface AdRemovalProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  durationDays: number | 'lifetime';
}

export const AD_REMOVAL_PRODUCTS: AdRemovalProduct[] = [
  {
    id: 'ad_free_lifetime',
    name: 'Ad-Free Pass (Lifetime)',
    description: 'All rewarded ad bonuses granted instantly without watching videos. Permanent.',
    price: '$4.99',
    durationDays: 'lifetime',
  },
  {
    id: 'ad_free_7day',
    name: 'Ad-Free Pass (7 Days)',
    description: 'Same as lifetime, but expires after 7 days.',
    price: '$0.99',
    durationDays: 7,
  },
];

// ─── IAP packs ────────────────────────────────────────────────────────────
// Intentionally NOT defined here. `IAP_COIN_PACKS` and `IAP_GEM_PACKS` in
// constants/economy.ts are the single source of truth for real-money pricing —
// duplicate tables previously lived here with different prices and quantities,
// which is exactly the kind of drift that ships a mispriced storefront.

// ─── Consumable price lookup (for store purchase validation) ─────────────

export const CONSUMABLE_PRICES: Record<ConsumableId, number> = Object.fromEntries(
  CONSUMABLE_ITEMS.map(i => [i.id, i.price])
) as Record<ConsumableId, number>;
