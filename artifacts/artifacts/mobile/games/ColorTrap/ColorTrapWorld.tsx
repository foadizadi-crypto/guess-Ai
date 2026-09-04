import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { TrapTone } from './trapTokens';
import { TrapEnvironment } from './TrapEnvironment';
import { TrapAtmosphere } from './TrapAtmosphere';
import { TrapForeground } from './TrapForeground';

type ColorTrapWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  urgency?: boolean;
  flash?: 'correct' | 'wrong' | null;
  ink?: string;
};

function inkWash(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return `rgba(139,92,246,${alpha})`;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ColorTrapWorld({
  children,
  quality,
  urgency = false,
  flash = null,
  ink,
}: ColorTrapWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (flash === 'wrong' || urgency) {
      return ['rgba(32,6,20,0.8)', 'rgba(255,45,149,0.2)', 'rgba(8,4,14,0.88)'];
    }
    if (flash === 'correct') {
      return ['rgba(6,22,28,0.72)', 'rgba(34,211,238,0.2)', 'rgba(8,4,18,0.84)'];
    }
    return ['rgba(12,6,24,0.74)', 'rgba(139,92,246,0.14)', 'rgba(7,4,16,0.86)'];
  }, [flash, urgency]);

  const spotColor =
    flash === 'wrong'
      ? 'rgba(255,45,149,0.24)'
      : flash === 'correct'
        ? 'rgba(34,211,238,0.22)'
        : urgency
          ? 'rgba(255,45,149,0.18)'
          : ink
            ? inkWash(ink, 0.2)
            : 'rgba(139,92,246,0.18)';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[TrapTone.void, TrapTone.velvet, '#0B0518']}
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
        <TrapEnvironment urgency={urgency || flash === 'wrong'} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <TrapAtmosphere quality={quality} urgency={urgency || flash === 'wrong'} />
        <DustMotes count={particleCountFor(quality)} color="rgba(165,243,252,0.9)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <TrapForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TrapTone.void },
  fill: { ...StyleSheet.absoluteFillObject },
  layer: { ...StyleSheet.absoluteFillObject },
  spot: {
    position: 'absolute',
    alignSelf: 'center',
    top: '24%',
    width: 272,
    height: 272,
    borderRadius: 136,
  },
  spotLow: { opacity: 0.5 },
  content: { flex: 1, zIndex: 4 },
});
