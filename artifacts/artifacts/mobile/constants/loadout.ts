/**
 * Shared cosmetic-equipment slots used by Personalization.
 *
 * Avatars and Wings keep their existing store fields. Pets and Stands use
 * this same catalog + owned-ids + equipped-id pattern so future items are
 * data, not one-off UI branches.
 */

export type CosmeticEquipSlot = 'pet' | 'stand';

export interface CosmeticEquipItem {
  id: string;
  name: string;
  slot: CosmeticEquipSlot;
  /** Ionicons glyph shown in the catalog and on the character stage. */
  icon: string;
  description: string;
  /** Every player starts with this item in owned* (no new shop SKU). */
  ownedByDefault: boolean;
}

export function defaultOwnedIds(items: readonly CosmeticEquipItem[]): string[] {
  return items.filter((item) => item.ownedByDefault).map((item) => item.id);
}

export function mergeOwnedIds(
  items: readonly CosmeticEquipItem[],
  owned: string[] | undefined,
): string[] {
  return Array.from(new Set([...defaultOwnedIds(items), ...(owned ?? [])]));
}

export function sanitizeEquippedId(
  items: readonly CosmeticEquipItem[],
  owned: string[],
  equipped: string | null | undefined,
): string | null {
  if (!equipped) return null;
  const found = items.some((item) => item.id === equipped);
  if (!found || !owned.includes(equipped)) return null;
  return equipped;
}
