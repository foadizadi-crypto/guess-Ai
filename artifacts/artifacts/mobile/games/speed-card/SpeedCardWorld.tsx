import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { SpeedTone } from './speedTokens';
import { TableEnvironment } from './TableEnvironment';
import { TableAtmosphere } from './TableAtmosphere';
import { TableForeground } from './TableForeground';

type SpeedCardWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  urgency?: boolean;
  flash?: 'correct' | 'wrong' | null;
};

export function SpeedCardWorld({
  children,
  quality,
  urgency = false,
  flash = null,
}: SpeedCardWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (flash === 'wrong' || urgency) {
      return ['rgba(28,6,14,0.78)', 'rgba(251,113,133,0.2)', 'rgba(8,4,14,0.86)'];
    }
    if (flash === 'correct') {
      return ['rgba(6,22,18,0.7)', 'rgba(52,211,153,0.18)', 'rgba(8,4,16,0.82)'];
    }
    return ['rgba(10,6,18,0.74)', 'rgba(125,211,252,0.12)', 'rgba(7,4,14,0.84)'];
  }, [flash, urgency]);

  const spotColor =
    flash === 'wrong'
      ? 'rgba(251,113,133,0.22)'
      : flash === 'correct'
        ? 'rgba(52,211,153,0.2)'
        : urgency
          ? 'rgba(251,113,133,0.16)'
          : 'rgba(125,211,252,0.16)';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[SpeedTone.void, SpeedTone.velvet, '#0C0514']}
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
        <TableEnvironment urgency={urgency || flash === 'wrong'} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <TableAtmosphere quality={quality} urgency={urgency || flash === 'wrong'} />
        <DustMotes count={particleCountFor(quality)} color="rgba(125,211,252,0.9)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <TableForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SpeedTone.void },
  fill: { ...StyleSheet.absoluteFillObject },
  layer: { ...StyleSheet.absoluteFillObject },
  spot: {
    position: 'absolute',
    alignSelf: 'center',
    top: '24%',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  spotLow: { opacity: 0.5 },
  content: { flex: 1, zIndex: 4 },
});
