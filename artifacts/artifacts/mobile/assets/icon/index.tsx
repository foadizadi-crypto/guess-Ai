/**
 * assets/icon — inline SVG icons + PNG icon wrappers used across the app.
 */
import React from "react";
import { Image, ImageStyle } from "react-native";
import { Svg, Circle, Text as SvgText } from "react-native-svg";
import { AnimatedIcon } from "@/components/AnimatedIcon";

interface IconProps {
  size?: number;
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

export function CoinIcon({ size = 20 }: IconProps) {
  return (
    <AnimatedIcon animation="pulse" style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="11" fill="#FFC93C" />
        <Circle
          cx="12"
          cy="12"
          r="8.5"
          fill="#FFB020"
          stroke="#E89B00"
          strokeWidth="1"
        />
        <SvgText
          x="12"
          y="16.5"
          fontSize="12"
          fontWeight="bold"
          fill="#8A5A00"
          textAnchor="middle"
        >
          $
        </SvgText>
      </Svg>
    </AnimatedIcon>
  );
}

// ─── PNG UI icons (assets/icon/) ──────────────────────────────────────────────

const UI_ICONS = {
  achievement: require("@/assets/icon/achievement.webp"),
  combo: require("@/assets/icon/combo.png"),
  correct: require("@/assets/icon/correct.png"),
  friends: require("@/assets/icon/friends.webp"),
  leaderboard: require("@/assets/icon/leaderboard.webp"),
  profile: require("@/assets/icon/profile.png"),
  score: require("@/assets/icon/score.png"),
  settings: require("@/assets/icon/settings.webp"),
  shop: require("@/assets/icon/shop.webp"),
  wrong: require("@/assets/icon/wrong.png"),
} as const;

export type UiIconName = keyof typeof UI_ICONS;

interface UiIconProps {
  name: UiIconName;
  size?: number;
  style?: ImageStyle;
}

export function UiIcon({ name, size = 24, style }: UiIconProps) {
  return (
    <AnimatedIcon animation="float" style={{ width: size, height: size }}>
      <Image
        source={UI_ICONS[name]}
        style={[{ width: size, height: size }, style]}
        resizeMode="contain"
      />
    </AnimatedIcon>
  );
}
