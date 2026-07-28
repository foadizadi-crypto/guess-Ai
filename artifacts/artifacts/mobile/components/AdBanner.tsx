/**
 * AdBanner — WEB / FALLBACK build.
 *
 * Metro uses this file on web and any platform without a .native.tsx override.
 * Renders a styled placeholder so the layout is preserved even when real ads
 * are not available.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

interface AdBannerProps {
  visible?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({ visible = true }) => {
  if (!visible) return null;
  return (
    <View style={styles.placeholder}>
      <Ionicons name="megaphone-outline" size={14} color={GameColors.textSecondary} />
      <Text style={styles.text}>Advertisement</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GameColors.border,
    borderStyle: 'dashed',
    marginHorizontal: 18,
  },
  text: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
  },
});
