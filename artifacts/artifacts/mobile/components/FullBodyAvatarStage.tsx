import React, { useCallback, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getCharacterStageAsset,
  WING_STAGE_ASSETS,
} from "@/constants/avatarStageAssets";

interface FullBodyAvatarStageProps {
  avatarId?: string;
  wingId?: string | null;
  level?: number;
}

/**
 * Lobby-only stage that composes a full-body character and optional wings.
 * It intentionally does not share the circular AvatarFrame implementation:
 * these images require contain rendering and calibrated anchor geometry.
 */
export function FullBodyAvatarStage({
  avatarId,
  wingId,
  level,
}: FullBodyAvatarStageProps) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStageSize((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  const character = getCharacterStageAsset(avatarId);
  const wing = wingId ? WING_STAGE_ASSETS[wingId] : undefined;
  const hasUnsupportedWing = Boolean(wingId && !wing);

  if (!stageSize.width || !stageSize.height) {
    return <View style={styles.stage} onLayout={onLayout} />;
  }

  // This ground line matches the top surface of the existing pedestal layer.
  // The stage extends below the avatar hitbox so the feet can meet it exactly.
  const groundY = stageSize.height * 0.85;
  const characterHeight = stageSize.height * 0.90 * character.scale;
  const characterWidth = characterHeight * character.aspectRatio;
  const characterLeft =
    stageSize.width / 2 - character.footAnchor.x * characterWidth;
  const characterTop =
    groundY - character.footAnchor.y * characterHeight;
  const waistX = characterLeft + character.waistAnchor.x * characterWidth;
  const waistY = characterTop + character.waistAnchor.y * characterHeight;

  const wingWidth = wing ? stageSize.width * 0.94 * wing.scale : 0;
  const wingHeight = wing ? wingWidth / wing.aspectRatio : 0;
  const wingLeft = wing ? waistX - wing.anchor.x * wingWidth : 0;
  const wingTop = wing ? waistY - wing.anchor.y * wingHeight : 0;

  return (
    <View style={styles.stage} onLayout={onLayout} pointerEvents="none">
      {wing && (
        <Image
          source={wing.source}
          resizeMode="contain"
          style={[
            styles.layer,
            {
              width: wingWidth,
              height: wingHeight,
              left: wingLeft,
              top: wingTop,
            },
          ]}
        />
      )}
      {hasUnsupportedWing && (
        <View style={styles.unavailableWingNotice}>
          <Text style={styles.unavailableWingText}>Wing art coming soon</Text>
        </View>
      )}
      <Image
        source={character.source}
        resizeMode="contain"
        style={[
          styles.layer,
          {
            width: characterWidth,
            height: characterHeight,
            left: characterLeft,
            top: characterTop,
          },
        ]}
      />
      {level !== undefined && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: "absolute",
    alignSelf: "center",
    width: "100%",
    height: "135%",
    top: 0,
  },
  layer: {
    position: "absolute",
  },
  levelBadge: {
    position: "absolute",
    left: "50%",
    bottom: 2,
    transform: [{ translateX: -24 }],
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(8, 14, 36, 0.86)",
    borderWidth: 1,
    borderColor: "#FFD700",
    alignItems: "center",
  },
  levelText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "800",
  },
  unavailableWingNotice: {
    position: "absolute",
    left: "50%",
    top: "42%",
    transform: [{ translateX: -58 }],
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(8, 14, 36, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  unavailableWingText: {
    color: "#E2E8F0",
    fontSize: 8,
    fontWeight: "700",
  },
});