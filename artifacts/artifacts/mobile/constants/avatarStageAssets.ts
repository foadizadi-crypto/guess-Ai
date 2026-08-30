import type { ImageSourcePropType } from "react-native";

import { WING_SOURCES, getAvatarSource } from "@/constants/characterSources";

/**
 * Compatibility shim. Geometry is no longer stored here — CharacterStage
 * sizes assets from detected content boxes.
 */
export const WING_STAGE_ASSETS: Record<string, { source: ImageSourcePropType }> = Object.fromEntries(
  Object.entries(WING_SOURCES).map(([id, source]) => [id, { source }]),
);

export function getCharacterStageAsset(avatarId?: string) {
  return { source: getAvatarSource(avatarId) };
}
