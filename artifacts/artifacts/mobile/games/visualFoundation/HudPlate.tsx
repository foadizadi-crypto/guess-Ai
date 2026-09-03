import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type HudPlateProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  blur?: boolean;
  border?: string;
  fill?: [string, string];
};

export function HudPlate({
  children,
  style,
  blur = false,
  border = 'rgba(201,162,74,0.28)',
  fill = ['rgba(18,10,28,0.82)', 'rgba(10,6,18,0.72)'],
}: HudPlateProps) {
  const body = (
    <LinearGradient colors={fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
      {children}
    </LinearGradient>
  );

  if (blur && Platform.OS !== 'web') {
    return (
      <BlurView intensity={22} tint="dark" style={[styles.plate, { borderColor: border }, style]}>
        {body}
      </BlurView>
    );
  }

  return <View style={[styles.plate, { borderColor: border }, style]}>{body}</View>;
}

const styles = StyleSheet.create({
  plate: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
