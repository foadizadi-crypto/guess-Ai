import type { ImageSourcePropType } from "react-native";

/**
 * Calibrated source geometry for the Character Customization stage.
 *
 * Unlike the lobby's pedestal-grounded `CHARACTER_STAGE_ASSETS` (which needs
 * separate foot + waist anchors to sit on a ground line), this stage only
 * needs ONE anchor per asset: the point where wings attach to the avatar's
 * back. Both avatar and wing metadata share the same shape (aspectRatio,
 * scale, anchorX, anchorY) so alignment is a single generic formula with no
 * per-combination special-casing — see components/CharacterStage.tsx.
 *
 * Sources come from assets/avatar/*.webp (the named, canonical character
 * renders used across the app for portraits and collections) rather than the
 * numbered assets/characters/*.webp set. Geometry values reuse the
 * calibration already measured for the identical underlying artwork.
 */
export interface CharacterAsset {
  source: ImageSourcePropType;
  aspectRatio: number; // width / height
  scale: number;
  anchorX: number;
  anchorY: number;
}

export const CHARACTER_ASSETS: Record<string, CharacterAsset> = {
  avatar_1:  { source: require("@/assets/avatar/Abigail.webp"), aspectRatio: 1080 / 1620, scale: 1.00, anchorX: 0.50, anchorY: 0.54 },
  avatar_2:  { source: require("@/assets/avatar/chloe.webp"),   aspectRatio: 1080 / 1350, scale: 0.92, anchorX: 0.50, anchorY: 0.54 },
  avatar_3:  { source: require("@/assets/avatar/Daveigh.webp"), aspectRatio: 1080 / 1620, scale: 1.00, anchorX: 0.50, anchorY: 0.53 },
  avatar_4:  { source: require("@/assets/avatar/Haley.webp"),   aspectRatio: 1080 / 1920, scale: 1.08, anchorX: 0.50, anchorY: 0.53 },
  avatar_5:  { source: require("@/assets/avatar/Heather.webp"), aspectRatio: 1080 / 1620, scale: 1.00, anchorX: 0.50, anchorY: 0.54 },
  avatar_6:  { source: require("@/assets/avatar/kirsten.webp"), aspectRatio: 1080 / 1620, scale: 1.04, anchorX: 0.50, anchorY: 0.50 },
  avatar_7:  { source: require("@/assets/avatar/Linda.webp"),   aspectRatio: 1080 / 1660, scale: 1.00, anchorX: 0.50, anchorY: 0.39 },
  avatar_8:  { source: require("@/assets/avatar/Marilyn.webp"), aspectRatio: 1080 / 1920, scale: 1.08, anchorX: 0.50, anchorY: 0.54 },
  avatar_9:  { source: require("@/assets/avatar/Patty.webp"),   aspectRatio: 1080 / 1920, scale: 1.05, anchorX: 0.50, anchorY: 0.50 },
  avatar_10: { source: require("@/assets/avatar/Sissy.webp"),   aspectRatio: 1080 / 1389, scale: 0.96, anchorX: 0.50, anchorY: 0.52 },
};

/** Same wing artwork already used by the lobby stage, re-exposed with the
 *  single-anchor shape this screen's alignment formula expects. */
export const WING_ASSETS: Record<string, CharacterAsset> = {
  wing_basic:   { source: require("@/assets/wings/base-wings.png"),   aspectRatio: 550 / 557, scale: 1.05, anchorX: 0.50, anchorY: 0.66 },
  wing_feather: { source: require("@/assets/wings/featur-wings.png"), aspectRatio: 518 / 386, scale: 1.08, anchorX: 0.50, anchorY: 0.62 },
  wing_star:    { source: require("@/assets/wings/star-wings.png"),   aspectRatio: 588 / 420, scale: 1.10, anchorX: 0.50, anchorY: 0.62 },
  wing_shadow:  { source: require("@/assets/wings/shadow-wings.png"), aspectRatio: 1,         scale: 0.98, anchorX: 0.50, anchorY: 0.62 },
  wing_angel:   { source: require("@/assets/wings/angel-wings.png"),  aspectRatio: 1,         scale: 1.08, anchorX: 0.50, anchorY: 0.67 },
};

export function getCharacterAsset(avatarId?: string): CharacterAsset {
  return CHARACTER_ASSETS[avatarId ?? ""] ?? CHARACTER_ASSETS.avatar_1;
}

export function getWingAsset(wingId?: string | null): CharacterAsset | undefined {
  return wingId ? WING_ASSETS[wingId] : undefined;
}
