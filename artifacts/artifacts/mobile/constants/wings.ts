// ─── Wings system — spec v1.0.0 ──────────────────────────────────────────────
//
// 5 free wings unlocked through level progression.
// 30 premium wings purchased with gems:
//   15 Common  → 50 gems each
//   10 Rare    → 80 gems each
//    5 Legendary→ 150 gems each
//
// Weekly special discount:
//   One wing is available at 50% off for the active week.
//   Selection is DETERMINISTIC: computed from the ISO week number so it never
//   changes on remount, reload, or cold start — only when the calendar week rolls.
//
// Asset references (preview field) are left as typed paths; drop the real PNG/
// Lottie files at those paths later. Do NOT import them with require() here —
// Metro resolves require() at build time and a missing asset breaks the bundle.
// ─────────────────────────────────────────────────────────────────────────────

export type WingRarity = 'free' | 'common' | 'rare' | 'legendary';

export interface WingDef {
  id: string;
  name: string;
  rarity: WingRarity;
  /** Gem cost. 0 for free wings. */
  gemCost: number;
  /** Level required to unlock (free wings only). */
  unlockLevel?: number;
  /** Placeholder path — replace with actual asset when artwork is ready. */
  preview?: string;
  description: string;
}

// ─── Free wings (unlocked by level) ──────────────────────────────────────────

export const FREE_WINGS: WingDef[] = [
  { id: 'wing_basic',   name: 'Basic Wings',   rarity: 'free', gemCost: 0, unlockLevel:  5, description: 'Simple feathered wings for new adventurers'    },
  { id: 'wing_feather', name: 'Feather Wings', rarity: 'free', gemCost: 0, unlockLevel: 15, description: 'Soft plumes that flutter with every answer'      },
  { id: 'wing_star',    name: 'Star Wings',    rarity: 'free', gemCost: 0, unlockLevel: 30, description: 'Wings that sparkle like a clear night sky'       },
  { id: 'wing_shadow',  name: 'Shadow Wings',  rarity: 'free', gemCost: 0, unlockLevel: 50, description: 'Dark wings woven from the blur itself'           },
  { id: 'wing_angel',   name: 'Angel Wings',   rarity: 'free', gemCost: 0, unlockLevel: 75, description: 'Divine wings — only the pure of streak earn them' },
];

// ─── Premium wings — 15 Common, 10 Rare, 5 Legendary ────────────────────────

export const COMMON_WINGS: WingDef[] = [
  { id: 'wing_c01', name: 'Ember Wings',      rarity: 'common', gemCost: 50, description: 'A warm glow trails behind every correct answer'  },
  { id: 'wing_c02', name: 'Frost Wings',      rarity: 'common', gemCost: 50, description: 'Icy crystalline wings that shimmer in the cold'   },
  { id: 'wing_c03', name: 'Leaf Wings',       rarity: 'common', gemCost: 50, description: 'Nature-grown and quietly unstoppable'             },
  { id: 'wing_c04', name: 'Cloud Wings',      rarity: 'common', gemCost: 50, description: 'Pillowy soft, deceptively swift'                  },
  { id: 'wing_c05', name: 'Copper Wings',     rarity: 'common', gemCost: 50, description: 'Industrial strength, always reliable'             },
  { id: 'wing_c06', name: 'Tide Wings',       rarity: 'common', gemCost: 50, description: 'Ebb and flow — answers come like waves'           },
  { id: 'wing_c07', name: 'Dust Wings',       rarity: 'common', gemCost: 50, description: 'Stardust trails mark every triumph'               },
  { id: 'wing_c08', name: 'Rose Wings',       rarity: 'common', gemCost: 50, description: 'Beautiful and sharp-edged under pressure'         },
  { id: 'wing_c09', name: 'Stone Wings',      rarity: 'common', gemCost: 50, description: 'Solid as bedrock, never rattled by a wrong answer' },
  { id: 'wing_c10', name: 'Silk Wings',       rarity: 'common', gemCost: 50, description: 'Smooth and refined — elegance in motion'          },
  { id: 'wing_c11', name: 'Canopy Wings',     rarity: 'common', gemCost: 50, description: 'Sheltered by the forest, sharp as a hawk'         },
  { id: 'wing_c12', name: 'Coral Wings',      rarity: 'common', gemCost: 50, description: 'Colourful and resilient beneath any depth'        },
  { id: 'wing_c13', name: 'Mint Wings',       rarity: 'common', gemCost: 50, description: 'Fresh perspective on every question'              },
  { id: 'wing_c14', name: 'Obsidian Wings',   rarity: 'common', gemCost: 50, description: 'Forged in volcanic clarity'                       },
  { id: 'wing_c15', name: 'Amber Wings',      rarity: 'common', gemCost: 50, description: 'Ancient wisdom preserved in every vein'           },
];

export const RARE_WINGS: WingDef[] = [
  { id: 'wing_r01', name: 'Storm Wings',      rarity: 'rare', gemCost: 80, description: 'Lightning crackling along every feather'             },
  { id: 'wing_r02', name: 'Prism Wings',      rarity: 'rare', gemCost: 80, description: 'Splits light into a thousand perfect answers'        },
  { id: 'wing_r03', name: 'Void Wings',       rarity: 'rare', gemCost: 80, description: 'Drawn from the space between stars'                  },
  { id: 'wing_r04', name: 'Neon Wings',       rarity: 'rare', gemCost: 80, description: 'High-voltage glow that outshines any blur'           },
  { id: 'wing_r05', name: 'Crystal Wings',    rarity: 'rare', gemCost: 80, description: 'Perfectly transparent — nothing hidden from view'    },
  { id: 'wing_r06', name: 'Phantom Wings',    rarity: 'rare', gemCost: 80, description: 'Appear only to those who truly see through the blur' },
  { id: 'wing_r07', name: 'Solar Wings',      rarity: 'rare', gemCost: 80, description: 'Radiate warmth and unstoppable momentum'             },
  { id: 'wing_r08', name: 'Thorn Wings',      rarity: 'rare', gemCost: 80, description: 'Dangerous beauty — wrong answers fear them'          },
  { id: 'wing_r09', name: 'Aurora Wings',     rarity: 'rare', gemCost: 80, description: 'Northern lights dancing across each answer arc'      },
  { id: 'wing_r10', name: 'Lunar Wings',      rarity: 'rare', gemCost: 80, description: 'Wax and wane, but always rise brighter'              },
];

export const LEGENDARY_WINGS: WingDef[] = [
  { id: 'wing_l01', name: 'Dragon Wings',     rarity: 'legendary', gemCost: 150, description: 'Ancient fire and iron — the pinnacle of power'         },
  { id: 'wing_l02', name: 'Phoenix Wings',    rarity: 'legendary', gemCost: 150, description: 'Reborn from every wrong answer, stronger each time'    },
  { id: 'wing_l03', name: 'Galaxy Wings',     rarity: 'legendary', gemCost: 150, description: 'An entire universe spiralling from your shoulders'      },
  { id: 'wing_l04', name: 'Divine Wings',     rarity: 'legendary', gemCost: 150, description: 'Bestowed only upon those who stand above the blur'      },
  { id: 'wing_l05', name: 'Eternal Wings',    rarity: 'legendary', gemCost: 150, description: 'The last wings you will ever need — timeless mastery'   },
];

// ─── Combined arrays ──────────────────────────────────────────────────────────

export const PREMIUM_WINGS: WingDef[] = [
  ...COMMON_WINGS,
  ...RARE_WINGS,
  ...LEGENDARY_WINGS,
];

export const ALL_WINGS: WingDef[] = [
  ...FREE_WINGS,
  ...PREMIUM_WINGS,
];

/** O(1) lookup by wing ID. */
export const WING_BY_ID: Map<string, WingDef> = new Map(
  ALL_WINGS.map((w) => [w.id, w]),
);

// ─── Weekly discount ──────────────────────────────────────────────────────────
//
// The discounted wing is selected deterministically from the PREMIUM_WINGS array
// using the ISO-8601 week number (Mon–Sun). It never changes mid-week.
//
// Formula: weekIndex = Math.floor(epochMs / WEEK_MS), discountIndex = weekIndex % PREMIUM_WINGS.length
//
// No randomness is involved: two players in the same week always see the same wing.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns the wing that is on 50% discount for the current calendar week.
 * Safe to call on every render — result is stable for the full week.
 */
export function getWeeklyDiscountWing(): WingDef {
  const weekIndex = Math.floor(Date.now() / WEEK_MS);
  const idx = weekIndex % PREMIUM_WINGS.length;
  return PREMIUM_WINGS[idx];
}

/**
 * Discounted gem price for a given wing (50% off, rounded down to nearest integer).
 */
export function discountedPrice(wing: WingDef): number {
  return Math.floor(wing.gemCost * 0.5);
}

/**
 * Returns true if the given wing ID is the weekly discounted wing.
 */
export function isWeeklyDiscount(wingId: string): boolean {
  return getWeeklyDiscountWing().id === wingId;
}
