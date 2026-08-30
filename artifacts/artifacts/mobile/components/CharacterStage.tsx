import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from "react-native";

import { ASSET_CONTENT_BOUNDS } from "@/constants/assetContentBounds";
import { getAvatarSource, getWingSource, hasWingArt } from "@/constants/characterSources";
import {
  computeCharacterLayout,
  type AssetMetrics,
  type CharacterStageMode,
} from "@/utils/characterLayout";

interface CharacterStageProps {
  avatarId?: string;
  wingId?: string | null;
  level?: number;
  mode?: CharacterStageMode;
  style?: ViewStyle;
}

function metricsFor(id: string | undefined): AssetMetrics | undefined {
  if (!id) return undefined;
  const bounds = ASSET_CONTENT_BOUNDS[id];
  if (!bounds) return undefined;
  return {
    canvasW: bounds.canvasW,
    canvasH: bounds.canvasH,
    box: {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
    },
  };
}

function fallbackMetrics(source: { width?: number; height?: number } | null | undefined): AssetMetrics {
  const width = source?.width || 1;
  const height = source?.height || 1;
  return {
    canvasW: width,
    canvasH: height,
    box: { left: 0, top: 0, right: 1, bottom: 1 },
  };
}

/** `Image.resolveAssetSource` is not implemented on react-native-web. */
function resolveAsset(source: ImageSourcePropType): { width?: number; height?: number } | null {
  const resolve = (Image as typeof Image & {
    resolveAssetSource?: (src: ImageSourcePropType) => { width?: number; height?: number } | null;
  }).resolveAssetSource;
  if (typeof resolve === "function") {
    try {
      return resolve(source);
    } catch {
      // web / metro can throw for numeric require ids
    }
  }
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const sized = source as { width?: number; height?: number };
    if (sized.width || sized.height) return sized;
  }
  return null;
}

/**
 * Shared full-body stage for lobby and customization.
 * Wings always attach to the detected center of the avatar's back.
 */
export function CharacterStage({
  avatarId,
  wingId,
  level,
  mode = "preview",
  style,
}: CharacterStageProps) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setStageSize((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  const avatarSource = getAvatarSource(avatarId);
  const wingSource = getWingSource(wingId);
  const missingWingArt = Boolean(wingId && !hasWingArt(wingId));

  const layout = useMemo(() => {
    const avatar = metricsFor(avatarId) ?? fallbackMetrics(resolveAsset(avatarSource));
    const wing = wingId
      ? (metricsFor(wingId) ?? (wingSource ? fallbackMetrics(resolveAsset(wingSource)) : undefined))
      : undefined;
    return computeCharacterLayout({
      stageW: stageSize.width,
      stageH: stageSize.height,
      avatar,
      wing,
      mode,
    });
  }, [avatarId, avatarSource, mode, stageSize.height, stageSize.width, wingId, wingSource]);

  const stageStyle = mode === "platform" ? styles.platformStage : styles.previewStage;

  if (!layout) {
    return <View style={[stageStyle, style]} onLayout={onLayout} />;
  }

  return (
    <View style={[stageStyle, style]} onLayout={onLayout} pointerEvents="none">
      {layout.wing && wingSource && (
        <Image
          source={wingSource}
          resizeMode="contain"
          style={[
            styles.layer,
            {
              width: layout.wing.width,
              height: layout.wing.height,
              left: layout.wing.left,
              top: layout.wing.top,
            },
          ]}
        />
      )}
      {missingWingArt && (
        <View style={styles.unavailableWingNotice}>
          <Text style={styles.unavailableWingText}>Wing art coming soon</Text>
        </View>
      )}
      <Image
        source={avatarSource}
        resizeMode="contain"
        style={[
          styles.layer,
          {
            width: layout.avatar.width,
            height: layout.avatar.height,
            left: layout.avatar.left,
            top: layout.avatar.top,
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
  platformStage: {
    position: "absolute",
    alignSelf: "center",
    width: "100%",
    height: "135%",
    top: 0,
    overflow: "visible",
  },
  previewStage: {
    width: "100%",
    height: "100%",
    overflow: "visible",
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
