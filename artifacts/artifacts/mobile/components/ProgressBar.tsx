import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';

interface ProgressBarProps {
  progress: number;        // 0.0 – 1.0
  color?: string;
  trackColor?: string;
  height?: number;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = GameColors.accentGold,
  trackColor = 'rgba(255,255,255,0.1)',
  height = 8,
  label,
  showPercentage = false,
  animated = true,
  style,
}) => {
  const { textAlign } = useRTL();
  const width = useSharedValue(0);
  const clamped = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    width.value = animated
      ? withTiming(clamped, { duration: 600, easing: Easing.out(Easing.cubic) })
      : clamped;
  }, [clamped, animated, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${(width.value * 100).toFixed(2)}%` as `${number}%`,
  }));

  return (
    <View style={[styles.container, style]}>
      {!!label && <Text style={[styles.label, { textAlign }]}>{label}</Text>}
      <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            fillStyle,
            { height, backgroundColor: color, borderRadius: height / 2 },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.pct, { textAlign }]}>{Math.round(clamped * 100)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', gap: 4 },
  label: { ...Typography.small, color: GameColors.textSecondary },
  track: { width: '100%', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0 },
  pct: { ...Typography.small, color: GameColors.textSecondary },
});
