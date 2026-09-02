import type { CosmeticEquipItem } from './loadout';
import { defaultOwnedIds } from './loadout';

/**
 * Stand / pedestal catalog for Personalization. Add items here — store + UI
 * read this list. Do not hard-code a single stand in screens.
 */
export const ALL_STANDS: readonly CosmeticEquipItem[] = [
  {
    id: 'stand_stone',
    name: 'Stone Pedestal',
    slot: 'stand',
    icon: 'cube',
    description: 'Classic lobby footing.',
    ownedByDefault: true,
  },
  {
    id: 'stand_gold',
    name: 'Gold Pedestal',
    slot: 'stand',
    icon: 'trophy',
    description: 'A brighter platform for your avatar.',
    ownedByDefault: true,
  },
  {
    id: 'stand_crystal',
    name: 'Crystal Dais',
    slot: 'stand',
    icon: 'diamond',
    description: 'Clear-cut edges under the stage.',
    ownedByDefault: true,
  },
  {
    id: 'stand_void',
    name: 'Void Plinth',
    slot: 'stand',
    icon: 'planet-outline',
    description: 'Reserved for a future unlock.',
    ownedByDefault: false,
  },
];

export const STAND_BY_ID: ReadonlyMap<string, CosmeticEquipItem> = new Map(
  ALL_STANDS.map((item) => [item.id, item]),
);

export const DEFAULT_OWNED_STANDS = defaultOwnedIds(ALL_STANDS);
