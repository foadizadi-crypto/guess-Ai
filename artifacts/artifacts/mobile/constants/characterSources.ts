import type { ImageSourcePropType } from "react-native";

/**
 * Artwork only. Sizing and attachment are computed at runtime from each
 * image's content box — see utils/characterLayout.ts.
 */
export const AVATAR_SOURCES: Record<string, ImageSourcePropType> = {
  abigail: require("@/assets/avatar/Abigail.webp"),
  chloe: require("@/assets/avatar/chloe.webp"),
  daveigh: require("@/assets/avatar/Daveigh.webp"),
  haley: require("@/assets/avatar/Haley.webp"),
  heather: require("@/assets/avatar/Heather.webp"),
  kirsten: require("@/assets/avatar/kirsten.webp"),
  linda: require("@/assets/avatar/Linda.webp"),
  marilyn: require("@/assets/avatar/Marilyn.webp"),
  patty: require("@/assets/avatar/Patty.webp"),
  sissy: require("@/assets/avatar/Sissy.webp"),
  avatar_1: require("@/assets/avatar/Abigail.webp"),
  avatar_2: require("@/assets/avatar/chloe.webp"),
  avatar_3: require("@/assets/avatar/Daveigh.webp"),
  avatar_4: require("@/assets/avatar/Haley.webp"),
  avatar_5: require("@/assets/avatar/Heather.webp"),
  avatar_6: require("@/assets/avatar/kirsten.webp"),
  avatar_7: require("@/assets/avatar/Linda.webp"),
  avatar_8: require("@/assets/avatar/Marilyn.webp"),
  avatar_9: require("@/assets/avatar/Patty.webp"),
  avatar_10: require("@/assets/avatar/Sissy.webp"),
};

export const WING_SOURCES: Record<string, ImageSourcePropType> = {
  wing_basic: require("@/assets/wings/base-wings.webp"),
  wing_feather: require("@/assets/wings/angel-wings.webp"),
  wing_star: require("@/assets/wings/shadow-wings.webp"),
  wing_shadow: require("@/assets/wings/shadow-wings.webp"),
  wing_angel: require("@/assets/wings/angel-wings.webp"),
};

export function getAvatarSource(avatarId?: string, imageKey?: string): ImageSourcePropType {
  if (avatarId && AVATAR_SOURCES[avatarId]) return AVATAR_SOURCES[avatarId];
  if (imageKey && AVATAR_SOURCES[imageKey]) return AVATAR_SOURCES[imageKey];
  return AVATAR_SOURCES.avatar_1;
}

export function getWingSource(wingId?: string | null): ImageSourcePropType | undefined {
  return wingId ? WING_SOURCES[wingId] : undefined;
}

export function hasWingArt(wingId?: string | null): boolean {
  return !!wingId && !!WING_SOURCES[wingId];
}
