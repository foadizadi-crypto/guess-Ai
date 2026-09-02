import type { CosmeticEquipItem } from './loadout';
import { defaultOwnedIds } from './loadout';

/**
 * Pet catalog for Personalization. Add items here — store + UI read this list.
 * Do not hard-code a single pet in screens.
 */
export const ALL_PETS: readonly CosmeticEquipItem[] = [
  {
    id: 'pet_fox',
    name: 'Spark Fox',
    slot: 'pet',
    icon: 'paw',
    description: 'A quick companion at your side.',
    ownedByDefault: true,
  },
  {
    id: 'pet_owl',
    name: 'Night Owl',
    slot: 'pet',
    icon: 'moon',
    description: 'Watches the lobby from your shoulder.',
    ownedByDefault: true,
  },
  {
    id: 'pet_ember',
    name: 'Ember Cub',
    slot: 'pet',
    icon: 'flame',
    description: 'Warm glow for late-night sessions.',
    ownedByDefault: true,
  },
  {
    id: 'pet_byte',
    name: 'Byte Bot',
    slot: 'pet',
    icon: 'hardware-chip-outline',
    description: 'Reserved for a future unlock.',
    ownedByDefault: false,
  },
];

export const PET_BY_ID: ReadonlyMap<string, CosmeticEquipItem> = new Map(
  ALL_PETS.map((item) => [item.id, item]),
);

export const DEFAULT_OWNED_PETS = defaultOwnedIds(ALL_PETS);
