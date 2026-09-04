import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { FlashTone, hexAlpha } from './neonTokens';
import { FlashEnvironment } from './FlashEnvironment';
import { FlashAtmosphere } from './FlashAtmosphere';
import { FlashForeground } from './FlashForeground';

type NeonFlashWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  watching?: boolean;
  activeLight?: string | null;
};

export function NeonFlashWorld({
  children,
  quality,
  watching = false,
  activeLight = null,
}: NeonFlashWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (watching) {
      return ['rgba(8,28,36,0.74)', 'rgba(34,240,255,0.18)', 'rgba(7,4,20,0.84)'];
    }
    return ['rgba(28,6,26,0.72)', 'rgba(255,43,214,0.16)', 'rgba(4,1,12,0.86)'];
  }, [watching]);

  const spotColor = activeLight
    ? hexAlpha(activeLight, 0.28)
    : watching
      ? 'rgba(34,240,255,0.2)'
      : 'rgba(255,43,214,0.18)';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[FlashTone.void, FlashTone.pit, '#12061F']}
        locations={[0, 0.46, 1]}
        style={[styles.fill, { zIndex: 0 }]}
        pointerEvents="none"
      />
      <LinearGradient colors={wash} locations={[0, 0.44, 1]} style={[styles.fill, { zIndex: 1 }]} pointerEvents="none" />
      <View
        pointerEvents="none"
        style={[styles.spot, { zIndex: 1, backgroundColor: spotColor }, quality === 'low' && styles.spotLow]}
      />

      <View style={[styles.layer, { zIndex: 2 }]} pointerEvents="none">
        <FlashEnvironment watching={watching} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <FlashAtmosphere quality={quality} watching={watching} />
        <DustMotes count={particleCountFor(quality)} color="rgba(34,240,255,0.92)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <FlashForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FlashTone.void },
  fill: { ...StyleSheet.absoluteFillObject },
  layer: { ...StyleSheet.absoluteFillObject },
  spot: {
    position: 'absolute',
    alignSelf: 'center',
    top: '26%',
    width: 268,
    height: 268,
    borderRadius: 134,
  },
  spotLow: { opacity: 0.5 },
  content: { flex: 1, zIndex: 4 },
});
