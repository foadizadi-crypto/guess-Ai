/**
 * Shop hotspot layout for the 1080 × 2340 shop_offer_BG art.
 * Values are percentages of the full screen. Do not convert to pixels.
 */
export type ShopPage = 'offers' | 'play' | 'gems' | 'cosmetics' | 'wings' | 'stamina';

export type ShopHitboxId =
  | 'nav_wings'
  | 'nav_stamina'
  | 'nav_gems'
  | 'nav_cosmetics'
  | 'offer_right'
  | 'offer_center'
  | 'offer_left'
  | 'offer_weekly'
  | 'offer_top';

export interface ShopHitbox {
  id: ShopHitboxId;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
}

/** Bottom shop navigation — painted on every shop page of this canvas. Right → left. */
export const SHOP_NAV_HITBOXES: ShopHitbox[] = [
  { id: 'nav_wings',     left: 76.85, top: 87.01, width: 18.52, height: 10.68, label: 'Wings' },
  { id: 'nav_stamina',   left: 52.50, top: 87.01, width: 18.52, height: 10.68, label: 'Stamina' },
  { id: 'nav_gems',      left: 29.07, top: 87.01, width: 18.52, height: 10.68, label: 'Gems' },
  { id: 'nav_cosmetics', left:  4.91, top: 87.01, width: 18.52, height: 10.68, label: 'Cosmetics' },
];

/** Main Offers page hotspots (excluding the shared nav). */
export const SHOP_OFFER_HITBOXES: ShopHitbox[] = [
  { id: 'offer_right',  left: 65.83, top: 48.03, width: 29.63, height: 34.19, label: 'Right legendary offer' },
  { id: 'offer_center', left: 38.06, top: 49.70, width: 23.15, height: 34.19, label: 'Center offer' },
  { id: 'offer_left',   left:  4.26, top: 48.25, width: 29.63, height: 34.19, label: 'Left legendary offer' },
  { id: 'offer_weekly', left:  6.67, top: 26.15, width: 84.81, height: 17.09, label: 'Featured weekly offer' },
  { id: 'offer_top',    left:  4.35, top:  1.71, width: 90.19, height:  6.41, label: 'Top banner offer' },
];

/** Catalog panel stops just above the nav row (nav top = 87.01%). */
export const SHOP_CATALOG_HEIGHT_PCT = '86.5%';

const HITBOX_Z_BASE = 10000;

export function shopHitboxZIndex(box: ShopHitbox): number {
  return Math.max(1, Math.round(HITBOX_Z_BASE - box.width * box.height));
}
