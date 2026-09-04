import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { TickTone } from './tickTokens';
import { ClockEnvironment } from './ClockEnvironment';
import { ClockAtmosphere } from './ClockAtmosphere';
import { ClockForeground } from './ClockForeground';

type TickLockWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  hidden?: boolean;
  running?: boolean;
  finished?: boolean;
};

export function TickLockWorld({
  children,
  quality,
  hidden = false,
  running = false,
  finished = false,
}: TickLockWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (hidden) {
      return ['rgba(28,8,14,0.78)', 'rgba(94,234,212,0.1)', 'rgba(8,4,10,0.86)'];
    }
    if (finished) {
      return ['rgba(22,14,8,0.7)', 'rgba(212,165,116,0.18)', 'rgba(8,6,12,0.82)'];
    }
    if (running) {
      return ['rgba(6,18,22,0.7)', 'rgba(94,234,212,0.18)', 'rgba(5,8,15,0.84)'];
    }
    return ['rgba(8,14,22,0.72)', 'rgba(139,164,184,0.14)', 'rgba(5,8,15,0.84)'];
  }, [finished, hidden, running]);

  const spotColor = hidden
    ? 'rgba(244,63,94,0.2)'
    : finished
      ? 'rgba(212,165,116,0.18)'
      : running
        ? 'rgba(94,234,212,0.2)'
        : 'rgba(139,164,184,0.16)';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[TickTone.void, TickTone.velvet, '#071018']}
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
        <ClockEnvironment hidden={hidden} running={running} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <ClockAtmosphere quality={quality} hidden={hidden} />
        <DustMotes count={particleCountFor(quality)} color="rgba(94,234,212,0.9)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <ClockForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TickTone.void },
  fill: { ...StyleSheet.absoluteFillObject },
  layer: { ...StyleSheet.absoluteFillObject },
  spot: {
    position: 'absolute',
    alignSelf: 'center',
    top: '24%',
    width: 268,
    height: 268,
    borderRadius: 134,
  },
  spotLow: { opacity: 0.5 },
  content: { flex: 1, zIndex: 4 },
});
