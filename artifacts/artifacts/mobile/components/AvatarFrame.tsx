import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
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

export const AvatarFrame: React.FC<AvatarFrameProps> = ({
  imageKey = 'person',
  level,
  size = 60,
  style,
  showLevel = false,
  locked = false,
}) => {
  const frameSize = size + 8;
  const borderRadius = frameSize / 2;

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
            },
          ]}
        >
          {locked ? (
            <Ionicons name="lock-closed" size={size * 0.45} color={GameColors.textSecondary} />
          ) : (
            <Ionicons
              name={({
                wolf: 'paw',
                hourglass: 'hourglass-outline',
                sparkles: 'sparkles',
                eye: 'eye',
                'shield-checkmark': 'shield-checkmark',
                clover: 'leaf',
                flame: 'flame',
                magnet: 'magnet',
                sunny: 'sunny',
                'hardware-chip': 'hardware-chip',
                person: 'person',
              }[imageKey] ?? 'person') as keyof typeof Ionicons.glyphMap}
              size={size * 0.55}
              color={GameColors.accentGold}
            />
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
