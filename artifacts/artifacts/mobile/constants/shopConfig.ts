/**
 * shopConfig.ts — single source of truth for ALL shop items.
 *
 * Every item name, price, description, icon, category, rarity, and currency
 * is defined here. UI components must read from this file — never hardcode
 * item definitions or prices in component files.
 *
 * Spec: Phase 1 — Economy + Shop Core §2, §3, §4, §7
 */
import type { UnifiedShopItem } from '@/types';

// ─── Rarity display colors (also exported for UI) ─────────────────────────────
export const RARITY_COLORS: Record<string, string> = {
  common:    '#9E9E9E',
  rare:      '#64B5F6',
  epic:      '#CE93D8',
  legendary: '#FFD700',
};

// ─── Consumables (Coin Shop — §3) ─────────────────────────────────────────────
export const CONSUMABLE_SHOP_ITEMS: UnifiedShopItem[] = [
  {
    id: 'time_boost',
    name: 'Time Boost',
    description: 'Adds +20 seconds to the timer for your next game session',
    icon: 'timer-outline',
    category: 'consumable',
    rarity: 'common',
    currencyType: 'coins',
    price: 100,
    unlockType: 'shop',
  },
  {
    id: 'combo_shield',
    name: 'Combo Shield',
    description: 'On a wrong answer, your combo drops 1 tier instead of fully resetting',
    icon: 'shield-half-outline',
    category: 'consumable',
    rarity: 'rare',
    currencyType: 'coins',
    price: 150,
    unlockType: 'shop',
  },
  {
    id: 'clarity_bomb',
    name: 'Clarity Bomb',
    description: 'Instantly removes 15% of the current image blur mid-session',
    icon: 'eye-outline',
    category: 'consumable',
    rarity: 'rare',
    currencyType: 'coins',
    price: 200,
    unlockType: 'shop',
  },
  {
    id: 'error_nullifier',
    name: 'Error Nullifier',
    description: 'Prevents image clarity loss on your next wrong answer',
    icon: 'shield-checkmark-outline',
    category: 'consumable',
    rarity: 'epic',
    currencyType: 'coins',
    price: 200,
    unlockType: 'shop',
  },
  {
    id: 'multiplier_2x',
    name: '2× Multiplier',
    description: 'Doubles both Coins & XP earned for the next 3 complete sessions',
    icon: 'flash-outline',
    category: 'consumable',
    rarity: 'legendary',
    currencyType: 'coins',
    price: 300,
    unlockType: 'shop',
  },
];

// ─── Avatars (Coin Shop — cosmetics) ─────────────────────────────────────────
export const AVATAR_SHOP_ITEMS: UnifiedShopItem[] = [
  { id: 'avatar_1',  name: 'Alpha Wolf',   description: 'The default hunter — cunning, bold, free.',        icon: 'paw-outline',             category: 'cosmetic', rarity: 'common',    currencyType: 'coins', price: 0,    unlockType: 'shop' },
  { id: 'avatar_2',  name: 'Time Master',  description: 'Bends time to answer faster.',                     icon: 'time-outline',            category: 'cosmetic', rarity: 'common',    currencyType: 'coins', price: 200,  unlockType: 'shop' },
  { id: 'avatar_3',  name: 'XP Sage',      description: 'Ancient wisdom powers every level-up.',            icon: 'library-outline',         category: 'cosmetic', rarity: 'rare',      currencyType: 'coins', price: 350,  unlockType: 'shop' },
  { id: 'avatar_4',  name: 'Visionary',    description: 'Sees through the blur before anyone else.',        icon: 'eye-outline',             category: 'cosmetic', rarity: 'rare',      currencyType: 'coins', price: 500,  unlockType: 'shop' },
  { id: 'avatar_5',  name: 'Ad Shield',    description: 'Blocks all distractions. Pure focus.',             icon: 'shield-outline',          category: 'cosmetic', rarity: 'rare',      currencyType: 'coins', price: 650,  unlockType: 'shop' },
  { id: 'avatar_6',  name: 'Lucky Charm',  description: 'Fortune favors the bold — and the lucky.',         icon: 'leaf-outline',            category: 'cosmetic', rarity: 'epic',      currencyType: 'coins', price: 800,  unlockType: 'shop' },
  { id: 'avatar_7',  name: 'Speed Demon',  description: 'Lightning reflexes. Zero hesitation.',             icon: 'rocket-outline',          category: 'cosmetic', rarity: 'epic',      currencyType: 'coins', price: 950,  unlockType: 'shop' },
  { id: 'avatar_8',  name: 'Coin Magnet',  description: 'Attracts coins like gravity.',                     icon: 'magnet-outline',          category: 'cosmetic', rarity: 'epic',      currencyType: 'coins', price: 1100, unlockType: 'shop' },
  { id: 'avatar_9',  name: 'Blur Buster',  description: 'Born to defeat blur. Legendary concentration.',    icon: 'sparkles-outline',        category: 'cosmetic', rarity: 'legendary', currencyType: 'coins', price: 1300, unlockType: 'shop' },
  { id: 'avatar_10', name: 'AI Oracle',    description: 'The future of quizzing. Answers from beyond.',     icon: 'hardware-chip-outline',   category: 'cosmetic', rarity: 'legendary', currencyType: 'coins', price: 1600, unlockType: 'shop' },
];

// ─── Power-ups (Coin Shop — consumables) ─────────────────────────────────────
export const POWERUP_SHOP_ITEMS: UnifiedShopItem[] = [
  { id: 'skip-question', name: 'Skip Question', description: 'Skip the current question without penalty',       icon: 'play-skip-forward-outline', category: 'consumable', rarity: 'common', currencyType: 'coins', price: 40,  unlockType: 'shop' },
  { id: 'hint',          name: 'Hint',          description: 'Reveals a helpful text clue about the image',    icon: 'bulb-outline',              category: 'consumable', rarity: 'common', currencyType: 'coins', price: 50,  unlockType: 'shop' },
  { id: 'reveal-blur',   name: 'Reveal Blur',   description: 'Removes all blur to show the full image',        icon: 'eye-sharp',                 category: 'consumable', rarity: 'common', currencyType: 'coins', price: 80,  unlockType: 'shop' },
  { id: 'double-xp',     name: 'Double XP',     description: 'Doubles all XP earned in the current session',   icon: 'star-outline',              category: 'consumable', rarity: 'rare',   currencyType: 'coins', price: 200, unlockType: 'shop' },
];

// All coin shop items — order: consumables → avatars → power-ups
export const ALL_COIN_SHOP_ITEMS: UnifiedShopItem[] = [
  ...CONSUMABLE_SHOP_ITEMS,
  ...AVATAR_SHOP_ITEMS,
  ...POWERUP_SHOP_ITEMS,
];

// ─── Gem Shop — Premium Cosmetics (§4) ───────────────────────────────────────
export const GEM_SHOP_ITEMS: UnifiedShopItem[] = [
  {
    id: 'gem_premium_badge',
    name: 'Premium Badge',
    description: 'A shining badge displayed on your profile — marks true dedication',
    icon: 'ribbon-outline',
    category: 'cosmetic',
    rarity: 'common',
    currencyType: 'gems',
    price: 30,
    unlockType: 'shop',
  },
  {
    id: 'gem_premium_title',
    name: 'Premium Title',
    description: 'Unlock an exclusive title displayed next to your username',
    icon: 'text-outline',
    category: 'cosmetic',
    rarity: 'common',
    currencyType: 'gems',
    price: 40,
    unlockType: 'shop',
  },
  {
    id: 'gem_entrance_effect',
    name: 'Entrance Effect',
    description: 'A dazzling animation plays when you enter a game session',
    icon: 'sparkles-outline',
    category: 'cosmetic',
    rarity: 'rare',
    currencyType: 'gems',
    price: 60,
    unlockType: 'shop',
  },
  {
    id: 'gem_premium_avatar',
    name: 'Premium Avatar',
    description: 'An exclusive animated avatar only obtainable with gems',
    icon: 'person-circle-outline',
    category: 'cosmetic',
    rarity: 'rare',
    currencyType: 'gems',
    price: 50,
    unlockType: 'shop',
  },
  {
    id: 'gem_premium_frame',
    name: 'Premium Frame',
    description: 'A stunning gold-accented frame that surrounds your avatar',
    icon: 'crop-outline',
    category: 'cosmetic',
    rarity: 'epic',
    currencyType: 'gems',
    price: 80,
    unlockType: 'shop',
  },
  {
    id: 'gem_premium_theme',
    name: 'Premium Theme',
    description: 'Transform the entire game UI with an exclusive color theme',
    icon: 'color-palette-outline',
    category: 'cosmetic',
    rarity: 'epic',
    currencyType: 'gems',
    price: 100,
    unlockType: 'shop',
  },
];

// ─── Convenience price maps (used by purchase validation in userStore) ────────
export const CONSUMABLE_PRICE_MAP: Record<string, number> = Object.fromEntries(
  CONSUMABLE_SHOP_ITEMS.map((i) => [i.id, i.price]),
);

export const POWERUP_PRICE_MAP: Record<string, number> = Object.fromEntries(
  POWERUP_SHOP_ITEMS.map((i) => [i.id, i.price]),
);

export const GEM_PRICE_MAP: Record<string, number> = Object.fromEntries(
  GEM_SHOP_ITEMS.map((i) => [i.id, i.price]),
);
