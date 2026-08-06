import React from 'react';
import { Image, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

interface AvatarFrameProps {
  imageKey?: string;
  frameId?: string;     // equipped frame cosmetic id, e.g. 'frame_3_gold'
  level?: number;
  size?: number;
  style?: ViewStyle;
  showLevel?: boolean;
  locked?: boolean;
  /**
   * heroMode — renders the frame image at 1.75× the avatar size so decorative
   * "wing" elements extend beyond the portrait circle, matching the reference design.
   * Has no effect when no frameId is supplied.
   */
  heroMode?: boolean;
}

// ─── Avatar PNG map ────────────────────────────────────────────────────────────
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

// Scale factor for hero mode — how much larger the frame renders vs the avatar
const HERO_SCALE = 1.75;

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  imageKey = 'abigail',
  frameId,
  level,
  size = 60,
  style,
  showLevel = false,
  locked = false,
  heroMode = false,
}) => {
  const avatarSource = AVATAR_IMAGES[imageKey];
  const frameSource  = frameId ? FRAME_IMAGES[frameId] : undefined;

  // In heroMode with a frame image, the container expands to heroScale×size so
  // wing/crown decorations can extend beyond the portrait circle.
  const useHero     = heroMode && !!frameSource && !locked;
  const containerSz = useHero ? Math.round(size * HERO_SCALE) : size + 8;
  // Avatar sits centred inside the container
  const avatarInset = Math.round((containerSz - size) / 2);

  const ringColor = locked
    ? GameColors.textSecondary
    : frameSource
      ? 'transparent'   // frame image replaces the solid border
      : GameColors.accentGold;

  return (
    <View style={[{ width: containerSz, height: containerSz }, style]}>

      {/* ── Avatar circle ────────────────────────────────────────────── */}
      <View
        style={{
          position: 'absolute',
          left: avatarInset,
          top:  avatarInset,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: locked
            ? 'rgba(176,176,176,0.15)'
            : 'rgba(255,215,0,0.12)',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
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

      {/* ── Gold ring — shown when there is no frame image ───────────── */}
      {!frameSource && !locked && (
        <View
          style={[
            styles.ring,
            {
              left: 0,
              top:  0,
              width:        containerSz,
              height:       containerSz,
              borderRadius: containerSz / 2,
              borderColor:  ringColor,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* ── Frame image overlay ──────────────────────────────────────── */}
      {frameSource && !locked && (
        <Image
          source={frameSource}
          style={{
            position: 'absolute',
            width:    containerSz,
            height:   containerSz,
            top:  0,
            left: 0,
          }}
          // 'contain' in heroMode keeps the full decoration visible without cropping
          resizeMode={useHero ? 'contain' : 'cover'}
        />
      )}

      {/* ── Level badge ──────────────────────────────────────────────── */}
      {showLevel && level !== undefined && (
        <View
          style={[
            styles.levelBadge,
            { bottom: avatarInset - 6, right: avatarInset - 6 },
          ]}
        >
          <Text style={styles.levelText}>{level}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  levelBadge: {
    position: 'absolute',
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
