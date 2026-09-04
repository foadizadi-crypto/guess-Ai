import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { VisualQuality } from '@/games/visualFoundation';
import { TwinTone } from './twinTokens';
import { TwinEnvironment } from './TwinEnvironment';
import { TwinAtmosphere } from './TwinAtmosphere';
import { TwinForeground } from './TwinForeground';

type TwinWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  pairRatio?: number;
  mismatch?: boolean;
};

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function TwinWorld({ children, quality, pairRatio = 0, mismatch = false }: TwinWorldProps) {
  const warmth = mismatch ? 0 : clamp01(pairRatio);

  const wash = useMemo((): [string, string, string] => {
    if (mismatch) {
      return ['rgba(28,8,18,0.78)', 'rgba(162,28,175,0.22)', 'rgba(12,4,16,0.84)'];
    }
    const top = 0.52 + warmth * 0.12;
    const mid = 0.08 + warmth * 0.1;
    const bot = 0.64 + warmth * 0.1;
    return [`rgba(8,6,20,${top})`, `rgba(94,234,212,${mid})`, `rgba(8,6,20,${bot})`];
  }, [mismatch, warmth]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[TwinTone.void, TwinTone.velvet, TwinTone.void]} locations={[0, 0.45, 1]} style={[styles.fill, { zIndex: 0 }]} pointerEvents="none" />
      <LinearGradient colors={wash} locations={[0, 0.44, 1]} style={[styles.fill, { zIndex: 1 }]} pointerEvents="none" />
      <View
        pointerEvents="none"
        style={[
          styles.spot,
          { zIndex: 1, backgroundColor: mismatch ? 'rgba(240,171,252,0.16)' : `rgba(94,234,212,${0.1 + warmth * 0.12})` },
          quality === 'low' && styles.spotLow,
        ]}
      />

      <View style={[styles.layer, { zIndex: 2 }]} pointerEvents="none">
        <TwinEnvironment warmth={warmth} mismatch={mismatch} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <TwinAtmosphere quality={quality} warmth={warmth} mismatch={mismatch} />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <TwinForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: TwinTone.void },
  fill: { ...StyleSheet.absoluteFillObject },
  layer: { ...StyleSheet.absoluteFillObject },
  spot: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 270,
    height: 270,
    borderRadius: 135,
  },
  spotLow: { opacity: 0.42 },
  content: { flex: 1, zIndex: 4 },
});
