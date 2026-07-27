import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { GameColors } from '@/theme/colors';

interface IconProps {
  size?: number;
  color?: string;
}

// ─── Coin ─────────────────────────────────────────────────────────────────

export const CoinIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.accentGold,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Circle cx="12" cy="12" r="7" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    <Path
      d="M12 7v2M12 15v2M9 12h6"
      stroke={GameColors.backgroundPrimary}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Star ─────────────────────────────────────────────────────────────────

export const StarIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.accentGold,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill={color}
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Trophy ───────────────────────────────────────────────────────────────

export const TrophyIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.accentGold,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 2H18V12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12V2Z" fill={color} />
    <Path
      d="M6 4H2V8C2 10.21 3.79 12 6 12M18 4H22V8C22 10.21 20.21 12 18 12"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M12 18V22M7 22H17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Lock ─────────────────────────────────────────────────────────────────

export const LockIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="5" y="11" width="14" height="11" rx="2" fill={color} />
    <Path
      d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <Circle cx="12" cy="16" r="1.5" fill={GameColors.backgroundPrimary} />
  </Svg>
);

// ─── Play ─────────────────────────────────────────────────────────────────

export const PlayIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.accentGold,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M8 5L19 12L8 19V5Z" fill={color} />
  </Svg>
);

// ─── Shop / Cart ──────────────────────────────────────────────────────────

export const ShopIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.accentGold,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.71 15.29C4.08 15.92 4.52 17 5.41 17H17M9 19C9 20.1 8.1 21 7 21C5.9 21 5 20.1 5 19C5 17.9 5.9 17 7 17C8.1 17 9 17.9 9 19ZM19 19C19 20.1 18.1 21 17 21C15.9 21 15 20.1 15 19C15 17.9 15.9 17 17 17C18.1 17 19 17.9 19 19Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// ─── Leaderboard ──────────────────────────────────────────────────────────

export const LeaderboardIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.accentGold,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="4" y="12" width="4" height="10" rx="1" fill={color} opacity={0.7} />
    <Rect x="10" y="7" width="4" height="15" rx="1" fill={color} />
    <Rect x="16" y="15" width="4" height="7" rx="1" fill={color} opacity={0.7} />
  </Svg>
);

// ─── Settings / Gear ──────────────────────────────────────────────────────

export const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="3" fill={color} />
    <Path
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z"
      fill={color}
    />
    <Circle cx="12" cy="12" r="3" fill={GameColors.backgroundPrimary} />
  </Svg>
);

// ─── Avatar / Person ──────────────────────────────────────────────────────

export const AvatarIcon: React.FC<IconProps> = ({
  size = 24,
  color = GameColors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="8" r="4" fill={color} />
    <Path
      d="M4 20C4 17.2 7.6 15 12 15C16.4 15 20 17.2 20 20"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);
