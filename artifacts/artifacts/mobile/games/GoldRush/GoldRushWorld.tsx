import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { GoldTone } from './goldTokens';
import { MineEnvironment } from './MineEnvironment';
import { MineAtmosphere } from './MineAtmosphere';
import { MineForeground } from './MineForeground';

const VAULT = require('./art/vault.jpg');

type GoldRushWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  threat: boolean;
};

export function GoldRushWorld({ children, quality, threat }: GoldRushWorldProps) {
  return (
    <View style={styles.root}>
      <ExpoImage source={VAULT} style={[styles.fill, { zIndex: 0 }]} contentFit="cover" cachePolicy="memory-disk" />
      <LinearGradient
        colors={['rgba(7,4,13,0.55)', 'rgba(7,4,13,0.18)', 'rgba(7,4,13,0.72)']}
        locations={[0, 0.42, 1]}
        style={[styles.fill, { zIndex: 1 }]}
      />
      <View style={[styles.spot, { zIndex: 1 }, quality === 'low' && styles.spotLow]} />
      {threat ? <View style={[styles.threat, { zIndex: 1 }]} /> : null}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 2 }} pointerEvents="none">
        <DustMotes count={particleCountFor(quality)} color="rgba(244,215,138,0.55)" />
      </View>

      {/* Layer 1 — Midground */}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 3 }} pointerEvents="none">
        <MineEnvironment />
      </View>

      {/* Layer 2 — Atmosphere */}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 4 }} pointerEvents="none">
        <MineAtmosphere />
      </View>

      {/* Layer 3 — Gameplay (HUD + cards) */}
      <View style={styles.content}>{children}</View>

      {/* Layer 4 — Foreground overlay */}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 6 }} pointerEvents="none">
        <MineForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GoldTone.void },
  fill: { ...StyleSheet.absoluteFillObject },
  spot: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(201,162,74,0.14)',
  },
  spotLow: { opacity: 0.45 },
  threat: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(140,18,28,0.22)',
  },
  content: { flex: 1, zIndex: 5 },
});
