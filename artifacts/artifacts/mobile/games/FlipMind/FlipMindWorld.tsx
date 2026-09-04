import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { MindTone } from './flipTokens';
import { MindEnvironment } from './MindEnvironment';
import { MindAtmosphere } from './MindAtmosphere';
import { MindForeground } from './MindForeground';

type FlipMindWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  urgency?: boolean;
  flash?: 'correct' | 'wrong' | null;
};

export function FlipMindWorld({ children, quality, urgency = false, flash = null }: FlipMindWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (flash === 'wrong' || urgency) {
      return ['rgba(28,6,16,0.78)', 'rgba(124,77,255,0.18)', 'rgba(8,4,14,0.86)'];
    }
    if (flash === 'correct') {
      return ['rgba(6,22,22,0.7)', 'rgba(52,211,153,0.2)', 'rgba(8,4,20,0.82)'];
    }
    return ['rgba(10,6,28,0.72)', 'rgba(124,77,255,0.16)', 'rgba(7,4,20,0.84)'];
  }, [flash, urgency]);

  const spotColor =
    flash === 'wrong'
      ? 'rgba(244,63,94,0.22)'
      : flash === 'correct'
        ? 'rgba(52,211,153,0.2)'
        : urgency
          ? 'rgba(251,113,133,0.18)'
          : 'rgba(124,77,255,0.2)';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[MindTone.void, MindTone.velvet, '#0B0520']}
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
        <MindEnvironment urgency={urgency || flash === 'wrong'} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <MindAtmosphere quality={quality} urgency={urgency || flash === 'wrong'} />
        <DustMotes count={particleCountFor(quality)} color="rgba(167,139,250,0.92)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <MindForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: MindTone.void },
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
