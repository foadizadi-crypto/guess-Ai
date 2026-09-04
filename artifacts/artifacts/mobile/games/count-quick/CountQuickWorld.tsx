import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { CountTone } from './countTokens';
import { CountEnvironment } from './CountEnvironment';
import { CountAtmosphere } from './CountAtmosphere';
import { CountForeground } from './CountForeground';

type CountQuickWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  urgency?: boolean;
  flash?: 'correct' | 'wrong' | null;
};

export function CountQuickWorld({
  children,
  quality,
  urgency = false,
  flash = null,
}: CountQuickWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (flash === 'wrong' || urgency) {
      return ['rgba(28,8,16,0.78)', 'rgba(251,113,133,0.2)', 'rgba(6,12,18,0.86)'];
    }
    if (flash === 'correct') {
      return ['rgba(6,28,24,0.7)', 'rgba(45,212,191,0.22)', 'rgba(6,16,24,0.82)'];
    }
    return ['rgba(6,18,28,0.72)', 'rgba(45,212,191,0.14)', 'rgba(6,14,22,0.84)'];
  }, [flash, urgency]);

  const spotColor =
    flash === 'wrong'
      ? 'rgba(244,63,94,0.22)'
      : flash === 'correct'
        ? 'rgba(45,212,191,0.22)'
        : urgency
          ? 'rgba(251,113,133,0.18)'
          : 'rgba(45,212,191,0.18)';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[CountTone.void, CountTone.velvet, '#081820']}
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
        <CountEnvironment urgency={urgency || flash === 'wrong'} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <CountAtmosphere quality={quality} urgency={urgency || flash === 'wrong'} />
        <DustMotes count={particleCountFor(quality)} color="rgba(45,212,191,0.9)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <CountForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CountTone.void },
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
