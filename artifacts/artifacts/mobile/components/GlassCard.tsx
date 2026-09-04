import React from 'react';
import { StyleSheet, ViewStyle, Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GameColors } from '@/theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 18,
  padding = 16,
}) => {
  const inner = [styles.inner, { padding }, style];

  // BlurView on Android is a screen-capture blur and hitchs the UI thread.
  // iOS blur is cheap; everywhere else use the same solid card.
  if (Platform.OS !== 'ios') {
    return (
      <View style={[styles.webFallback, { padding }, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.blur, inner]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  inner: {
    // padding applied via prop
  },
  webFallback: {
    backgroundColor: 'rgba(30,30,46,0.85)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
});
