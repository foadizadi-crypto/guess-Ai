import React from "react";

import { CharacterStage } from "@/components/CharacterStage";

interface FullBodyAvatarStageProps {
  avatarId?: string;
  wingId?: string | null;
  level?: number;
}

/** Lobby pedestal stage — same compositor as customization. */
export function FullBodyAvatarStage({
  avatarId,
  wingId,
  level,
}: FullBodyAvatarStageProps) {
  return (
    <CharacterStage
      avatarId={avatarId}
      wingId={wingId}
      level={level}
      mode="platform"
    />
  );
}
