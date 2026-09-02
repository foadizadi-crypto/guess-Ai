import React from "react";

import { CharacterStage } from "@/components/CharacterStage";

interface FullBodyAvatarStageProps {
  avatarId?: string;
  wingId?: string | null;
  petId?: string | null;
  standId?: string | null;
  level?: number;
}

/** Lobby pedestal stage — same compositor as customization. */
export function FullBodyAvatarStage({
  avatarId,
  wingId,
  petId,
  standId,
  level,
}: FullBodyAvatarStageProps) {
  return (
    <CharacterStage
      avatarId={avatarId}
      wingId={wingId}
      petId={petId}
      standId={standId}
      level={level}
      mode="platform"
    />
  );
}
