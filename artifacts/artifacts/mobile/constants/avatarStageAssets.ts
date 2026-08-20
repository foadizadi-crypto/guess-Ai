import type { ImageSourcePropType } from "react-native";

/**
 * Calibrated source geometry for the full-body lobby stage.
 * Anchor coordinates are normalized to each complete source image, including
 * transparent padding. The foot anchor is pinned to the shared pedestal line;
 * the waist anchor is the destination for a wing attachment point.
 */
export interface CharacterStageAsset {
  source: ImageSourcePropType;
  aspectRatio: number;
  scale: number;
  footAnchor: { x: number; y: number };
  waistAnchor: { x: number; y: number };
}

export interface WingStageAsset {
  source: ImageSourcePropType;
  aspectRatio: number;
  scale: number;
  anchor: { x: number; y: number };
}

export const CHARACTER_STAGE_ASSETS: Record<string, CharacterStageAsset> = {
  avatar_1:  { source: require("@/assets/characters/1.webp"),  aspectRatio: 1080 / 1620, scale: 1.00, footAnchor: { x: 0.50, y: 0.936 }, waistAnchor: { x: 0.50, y: 0.54 } },
  avatar_2:  { source: require("@/assets/characters/2.webp"),  aspectRatio: 1080 / 1350, scale: 0.92, footAnchor: { x: 0.50, y: 0.961 }, waistAnchor: { x: 0.50, y: 0.54 } },
  avatar_3:  { source: require("@/assets/characters/3.webp"),  aspectRatio: 1080 / 1620, scale: 1.00, footAnchor: { x: 0.50, y: 0.947 }, waistAnchor: { x: 0.50, y: 0.53 } },
  avatar_4:  { source: require("@/assets/characters/4.webp"),  aspectRatio: 1080 / 1920, scale: 1.08, footAnchor: { x: 0.50, y: 0.951 }, waistAnchor: { x: 0.50, y: 0.53 } },
  avatar_5:  { source: require("@/assets/characters/5.webp"),  aspectRatio: 1080 / 1620, scale: 1.00, footAnchor: { x: 0.50, y: 0.928 }, waistAnchor: { x: 0.50, y: 0.54 } },
  avatar_6:  { source: require("@/assets/characters/6.webp"),  aspectRatio: 1080 / 1620, scale: 1.04, footAnchor: { x: 0.50, y: 0.897 }, waistAnchor: { x: 0.50, y: 0.50 } },
  avatar_7:  { source: require("@/assets/characters/7.webp"),  aspectRatio: 1080 / 1620, scale: 1.00, footAnchor: { x: 0.50, y: 0.928 }, waistAnchor: { x: 0.50, y: 0.54 } },
  avatar_8:  { source: require("@/assets/characters/8.webp"),  aspectRatio: 1080 / 1920, scale: 1.08, footAnchor: { x: 0.50, y: 0.954 }, waistAnchor: { x: 0.50, y: 0.54 } },
  avatar_9:  { source: require("@/assets/characters/9.webp"),  aspectRatio: 1080 / 1920, scale: 1.05, footAnchor: { x: 0.50, y: 0.944 }, waistAnchor: { x: 0.50, y: 0.50 } },
  avatar_10: { source: require("@/assets/characters/10.png"), aspectRatio: 1080 / 1389, scale: 0.96, footAnchor: { x: 0.50, y: 0.984 }, waistAnchor: { x: 0.50, y: 0.52 } },
};

/** Only wing artwork available in the project is registered here. */
export const WING_STAGE_ASSETS: Record<string, WingStageAsset> = {
  wing_basic: {
    source: require("@/assets/wings/base-wings.png"),
    aspectRatio: 550 / 557,
    scale: 1.05,
    anchor: { x: 0.50, y: 0.66 },
  },
  wing_feather: {
    source: require("@/assets/wings/featur-wings.png"),
    aspectRatio: 518 / 386,
    scale: 1.08,
    anchor: { x: 0.50, y: 0.62 },
  },
  wing_star: {
    source: require("@/assets/wings/star-wings.png"),
    aspectRatio: 588 / 420,
    scale: 1.10,
    anchor: { x: 0.50, y: 0.62 },
  },
  wing_shadow: {
    source: require("@/assets/wings/shadow-wings.png"),
    aspectRatio: 1,
    scale: 0.98,
    anchor: { x: 0.50, y: 0.62 },
  },
  wing_angel: {
    source: require("@/assets/wings/angel-wings.png"),
    aspectRatio: 1,
    scale: 1.08,
    anchor: { x: 0.50, y: 0.67 },
  },
};

export function getCharacterStageAsset(avatarId?: string): CharacterStageAsset {
  return CHARACTER_STAGE_ASSETS[avatarId ?? ""] ?? CHARACTER_STAGE_ASSETS.avatar_1;
}