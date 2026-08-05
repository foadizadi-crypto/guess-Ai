import React from 'react';
import { Image, StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

interface AvatarFrameProps {
  imageKey?: string;
  level?: number;
  size?: number;
  style?: ViewStyle;
  showLevel?: boolean;
  locked?: boolean;
}

// ─── Avatar PNG map ────────────────────────────────────────────────────────────
// Accepts both avatar_N ids (used by selectedAvatarId) and imageKey strings
// (used by DEFAULT_AVATARS). Both map to the same character art PNG.
const AVATAR_IMAGES: Record<string, ReturnType<typeof require>> = {
  // by avatar id
  avatar_1:        require('@/assets/avatars/AKASHA.png'),
  avatar_2:        require('@/assets/avatars/AUREY.jpg'),
  avatar_3:        require('@/assets/avatars/CELECTE.png'),
  avatar_4:        require('@/assets/avatars/EVILA.png'),
  avatar_5:        require('@/assets/avatars/EVILI.png'),
  avatar_6:        require('@/assets/avatars/GIA.png'),
  avatar_7:        require('@/assets/avatars/KOSMOS.png'),
  avatar_8:        require('@/assets/avatars/LUNA.png'),
  avatar_9:        require('@/assets/avatars/NOVA.png'),
  avatar_10:       require('@/assets/avatars/ZEPHRE.png'),
  // by imageKey (DEFAULT_AVATARS.imageKey)
  wolf:            require('@/assets/avatars/AKASHA.png'),
  hourglass:       require('@/assets/avatars/AUREY.jpg'),
  sparkles:        require('@/assets/avatars/CELECTE.png'),
  eye:             require('@/assets/avatars/EVILA.png'),
  'shield-checkmark': require('@/assets/avatars/EVILI.png'),
  clover:          require('@/assets/avatars/GIA.png'),
  flame:           require('@/assets/avatars/KOSMOS.png'),
  magnet:          require('@/assets/avatars/LUNA.png'),
  sunny:           require('@/assets/avatars/NOVA.png'),
  'hardware-chip': require('@/assets/avatars/ZEPHRE.png'),
};

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  imageKey = 'wolf',
  level,
  size = 60,
  style,
  showLevel = false,
  locked = false,
}) => {
  const frameSize = size + 8;
  const borderRadius = frameSize / 2;
  const avatarSource = AVATAR_IMAGES[imageKey];

  return (
    <View style={[{ width: frameSize, height: frameSize }, style]}>
      {/* Gold ring frame */}
      <View
        style={[
          styles.frame,
          {
            width: frameSize,
            height: frameSize,
            borderRadius,
            borderColor: locked ? GameColors.textSecondary : GameColors.accentGold,
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
