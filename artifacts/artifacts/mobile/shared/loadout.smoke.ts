import { STAMINA_UPGRADE_LEVELS, getUpgradeGemCost, getUpgradeCoinCost } from '@/constants/economy';
import { ALL_PETS, PET_BY_ID, DEFAULT_OWNED_PETS } from '@/constants/pets';
import { ALL_STANDS, STAND_BY_ID, DEFAULT_OWNED_STANDS } from '@/constants/stands';
import { mergeOwnedIds, sanitizeEquippedId } from '@/constants/loadout';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(ALL_PETS.length >= 2, 'pets catalog is extensible');
assert(ALL_STANDS.length >= 2, 'stands catalog is extensible');
assert(new Set(ALL_PETS.map((p) => p.id)).size === ALL_PETS.length, 'pet ids unique');
assert(new Set(ALL_STANDS.map((s) => s.id)).size === ALL_STANDS.length, 'stand ids unique');
assert(ALL_PETS.every((p) => p.slot === 'pet' && PET_BY_ID.get(p.id) === p), 'pet lookup');
assert(ALL_STANDS.every((s) => s.slot === 'stand' && STAND_BY_ID.get(s.id) === s), 'stand lookup');
assert(DEFAULT_OWNED_PETS.length >= 1, 'at least one default pet');
assert(DEFAULT_OWNED_STANDS.length >= 1, 'at least one default stand');

const ownedPets = mergeOwnedIds(ALL_PETS, []);
assert(ownedPets.includes(DEFAULT_OWNED_PETS[0]), 'default pets merge');
assert(sanitizeEquippedId(ALL_PETS, ownedPets, DEFAULT_OWNED_PETS[0]) === DEFAULT_OWNED_PETS[0], 'equip owned pet');
assert(sanitizeEquippedId(ALL_PETS, ownedPets, 'pet_byte') === null, 'cannot equip unowned pet');
assert(sanitizeEquippedId(ALL_PETS, ownedPets, null) === null, 'none is valid');

const ownedStands = mergeOwnedIds(ALL_STANDS, ['stand_void']);
assert(ownedStands.includes('stand_void') && ownedStands.includes(DEFAULT_OWNED_STANDS[0]), 'stands merge preserves extras');
assert(sanitizeEquippedId(ALL_STANDS, ownedStands, 'stand_void') === 'stand_void', 'equip extra stand');

assert(
  STAMINA_UPGRADE_LEVELS.map((l) => l.cap).join(',') === '100,150,250,400',
  'stamina caps unchanged',
);
assert(getUpgradeGemCost(1) === 50 && getUpgradeGemCost(2) === 150 && getUpgradeGemCost(3) === 250, 'upgrade gem costs unchanged');
assert(getUpgradeCoinCost(1) === 25_000 && getUpgradeCoinCost(2) == null && getUpgradeCoinCost(3) == null, 'upgrade coin costs unchanged');

console.log('loadout smoke ok');
