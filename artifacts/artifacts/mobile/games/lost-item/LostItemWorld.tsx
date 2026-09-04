import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { FindTone } from './searchTokens';
import { SearchEnvironment } from './SearchEnvironment';
import { SearchAtmosphere } from './SearchAtmosphere';
import { SearchForeground } from './SearchForeground';

type LostItemWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  blackout?: boolean;
  urgency?: boolean;
  flash?: 'correct' | 'wrong' | null;
};

export function LostItemWorld({
  children,
  quality,
  blackout = false,
  urgency = false,
  flash = null,
}: LostItemWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (flash === 'wrong' || (urgency && !blackout)) {
      return ['rgba(28,8,10,0.78)', 'rgba(255,77,109,0.16)', 'rgba(10,4,6,0.86)'];
    }
    if (flash === 'correct') {
      return ['rgba(8,28,18,0.7)', 'rgba(61,220,151,0.18)', 'rgba(8,6,4,0.82)'];
    }
    if (blackout) {
      return ['rgba(4,2,2,0.88)', 'rgba(255,112,67,0.05)', 'rgba(2,1,1,0.92)'];
    }
    return ['rgba(16,8,6,0.7)', 'rgba(255,112,67,0.14)', 'rgba(8,4,4,0.84)'];
  }, [blackout, flash, urgency]);

  const spotColor =
    flash === 'wrong'
      ? 'rgba(255,77,109,0.22)'
      : flash === 'correct'
        ? 'rgba(61,220,151,0.2)'
        : blackout
          ? 'rgba(255,112,67,0.08)'
          : urgency
            ? 'rgba(255,112,67,0.2)'
            : 'rgba(255,176,136,0.2)';

  const motes = blackout ? 0 : particleCountFor(quality);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[FindTone.void, FindTone.velvet, '#12080C']}
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
        <SearchEnvironment blackout={blackout} urgency={urgency || flash === 'wrong'} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <SearchAtmosphere quality={quality} blackout={blackout} urgency={urgency || flash === 'wrong'} />
        <DustMotes count={motes} color="rgba(240,192,120,0.92)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <SearchForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FindTone.void },
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
