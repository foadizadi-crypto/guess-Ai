import { getAvatarSource, getWingSource } from "@/constants/characterSources";

export function getCharacterAsset(avatarId?: string) {
  return { source: getAvatarSource(avatarId) };
}

export function getWingAsset(wingId?: string | null) {
  const source = getWingSource(wingId);
  return source ? { source } : undefined;
}
