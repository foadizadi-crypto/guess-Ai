import React, { useCallback, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, View, ViewStyle } from "react-native";

import { getCharacterAsset, getWingAsset } from "@/constants/characterStageAssets";

interface CharacterStageProps {
  avatarId?: string;
  wingId?: string | null;
  style?: ViewStyle;
}

/**
 * Reusable full-body avatar + wing preview.
 *
 * Position is always derived from the two assets' own metadata (aspectRatio,
 * scale, anchorX/anchorY) — there is no per-avatar/per-wing/per-combination
 * branching here. The avatar is fit centered inside the stage; the wing is
 * placed so its own anchor point lands exactly on the avatar's anchor point
 * (the back/shoulder attachment spot), then both layers redraw immediately
 * whenever `avatarId` or `wingId` changes.
 */
export function CharacterStage({ avatarId, wingId, style }: CharacterStageProps) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStageSize((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  const avatar = getCharacterAsset(avatarId);
  const wing = getWingAsset(wingId);

  if (!stageSize.width || !stageSize.height) {
    return <View style={[styles.stage, style]} onLayout={onLayout} />;
  }

  const avatarHeight = stageSize.height * 0.94 * avatar.scale;
  const avatarWidth = avatarHeight * avatar.aspectRatio;
  const avatarLeft = stageSize.width / 2 - avatarWidth / 2;
  const avatarTop = stageSize.height / 2 - avatarHeight / 2;

  const anchorX = avatarLeft + avatar.anchorX * avatarWidth;
  const anchorY = avatarTop + avatar.anchorY * avatarHeight;

  const wingWidth = wing ? stageSize.width * 0.92 * wing.scale : 0;
  const wingHeight = wing ? wingWidth / wing.aspectRatio : 0;
  const wingLeft = wing ? anchorX - wing.anchorX * wingWidth : 0;
  const wingTop = wing ? anchorY - wing.anchorY * wingHeight : 0;

  return (
    <View style={[styles.stage, style]} onLayout={onLayout} pointerEvents="none">
      {wing && (
        <Image
          source={wing.source}
          resizeMode="contain"
          style={[styles.layer, { width: wingWidth, height: wingHeight, left: wingLeft, top: wingTop }]}
        />
      )}
      <Image
        source={avatar.source}
        resizeMode="contain"
        style={[styles.layer, { width: avatarWidth, height: avatarHeight, left: avatarLeft, top: avatarTop }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: "100%",
    height: "100%",
  },
  layer: {
    position: "absolute",
  },
});
