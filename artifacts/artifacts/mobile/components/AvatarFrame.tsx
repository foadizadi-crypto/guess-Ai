import React from 'react';
import { Image, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

interface AvatarFrameProps {
  imageKey?: string;
  frameId?: string;           // equipped frame cosmetic id, e.g. 'frame_3_gold'
  level?: number;
  size?: number;
  style?: ViewStyle;
  showLevel?: boolean;
  locked?: boolean;
}

// ─── Avatar PNG map ────────────────────────────────────────────────────────────
// Keyed by both avatar_N id AND the imageKey string (DEFAULT_AVATARS.imageKey)
const AVATAR_IMAGES: Record<string, ReturnType<typeof require>> = {
  // by imageKey
  abigail: require('@/assets/avatar/Abigail.webp'),
  chloe:   require('@/assets/avatar/chlöe.webp'),
  daveigh: require('@/assets/avatar/Daveigh.webp'),
  haley:   require('@/assets/avatar/Haley.webp'),
  heather: require('@/assets/avatar/Heather.webp'),
  kirsten: require('@/assets/avatar/kirsten.webp'),
  linda:   require('@/assets/avatar/Linda.webp'),
  marilyn: require('@/assets/avatar/Marilyn.webp'),
  patty:   require('@/assets/avatar/Patty.webp'),
  sissy:   require('@/assets/avatar/Sissy.webp'),
  // by avatar id (selectedAvatarId)
  avatar_1:  require('@/assets/avatar/Abigail.webp'),
  avatar_2:  require('@/assets/avatar/chlöe.webp'),
  avatar_3:  require('@/assets/avatar/Daveigh.webp'),
  avatar_4:  require('@/assets/avatar/Haley.webp'),
  avatar_5:  require('@/assets/avatar/Heather.webp'),
  avatar_6:  require('@/assets/avatar/kirsten.webp'),
  avatar_7:  require('@/assets/avatar/Linda.webp'),
  avatar_8:  require('@/assets/avatar/Marilyn.webp'),
  avatar_9:  require('@/assets/avatar/Patty.webp'),
  avatar_10: require('@/assets/avatar/Sissy.webp'),
};

// ─── Frame PNG map ─────────────────────────────────────────────────────────────
const FRAME_IMAGES: Record<string, ReturnType<typeof require>> = {
  frame_0_simple:    require('@/assets/frames/0-simple.jpg'),
  frame_1_bronze:    require('@/assets/frames/1-bronze.jpg'),
  frame_2_silver:    require('@/assets/frames/2-silver.jpg'),
  frame_3_gold:      require('@/assets/frames/3-gold.jpg'),
  frame_4_neon:      require('@/assets/frames/4-neon.jpg'),
  frame_5_galaxy:    require('@/assets/frames/5-galaxy.jpg'),
  frame_6_diamond:   require('@/assets/frames/6-diamond.jpg'),
  frame_7_fire:      require('@/assets/frames/7-fire.jpg'),
  frame_8_animated:  require('@/assets/frames/8-animated.jpg'),
  frame_9_legendary: require('@/assets/frames/9-legendary.jpg'),
};

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  imageKey = 'abigail',
  frameId,
  level,
  size = 60,
  style,
  showLevel = false,
  locked = false,
}) => {
  const frameSize = size + 8;
  const borderRadius = frameSize / 2;
  const avatarSource = AVATAR_IMAGES[imageKey];
  const frameSource = frameId ? FRAME_IMAGES[frameId] : undefined;
  const borderColor = locked
    ? GameColors.textSecondary
    : frameSource
      ? 'transparent'         // frame image replaces the solid border
      : GameColors.accentGold;

  return (
    <View style={[{ width: frameSize, height: frameSize }, style]}>
      {/* Gold ring / frame image */}
      <View
        style={[
          styles.frame,
          {
            width: frameSize,
            height: frameSize,
            borderRadius,
            borderColor,
          },
        ]}
      >
        {/* Avatar circle */}
        <View
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: locked
                ? 'rgba(176,176,176,0.15)'
                : 'rgba(255,215,0,0.12)',
              overflow: 'hidden',
            },
          ]}
        >
          {locked ? (
            <Ionicons name="lock-closed" size={size * 0.45} color={GameColors.textSecondary} />
          ) : avatarSource ? (
            <Image
              source={avatarSource}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={size * 0.55} color={GameColors.accentGold} />
          )}
        </View>

        {/* Frame overlay (rendered on top of the avatar circle) */}
        {frameSource && !locked && (
          <Image
            source={frameSource}
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius, width: frameSize, height: frameSize },
            ]}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Level badge */}
      {showLevel && level !== undefined && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: GameColors.accentGold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    ...Typography.small,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
  },
});
