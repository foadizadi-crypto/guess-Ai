import React, { useMemo } from 'react';
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
  round?: number;
  maxRounds?: number;
  pot?: number;
};

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function GoldRushWorld({
  children,
  quality,
  threat,
  round = 1,
  maxRounds = 20,
  pot = 0,
}: GoldRushWorldProps) {
  const roundT = clamp01((round - 1) / Math.max(1, maxRounds - 1));
  const potT = clamp01(pot / 280);
  const warmth = threat ? 0 : potT;

  const wash = useMemo((): [string, string, string] => {
    if (threat) {
      return ['rgba(42,6,10,0.78)', 'rgba(110,16,22,0.34)', 'rgba(16,4,8,0.84)'];
    }
    const top = 0.5 + roundT * 0.2;
    const gold = 0.07 + potT * 0.14;
    const bot = 0.62 + roundT * 0.16;
    return [`rgba(7,4,13,${top})`, `rgba(201,162,74,${gold})`, `rgba(7,4,13,${bot})`];
  }, [threat, roundT, potT]);

  const spotColor = threat
    ? 'rgba(181,82,42,0.2)'
    : `rgba(201,162,74,${0.12 + potT * 0.14})`;

  return (
    <View style={styles.root}>
      <ExpoImage
        source={VAULT}
        style={[styles.fill, { zIndex: 0 }]}
        contentFit="cover"
        cachePolicy="memory-disk"
        pointerEvents="none"
      />
      <LinearGradient colors={wash} locations={[0, 0.42, 1]} style={[styles.fill, { zIndex: 1 }]} pointerEvents="none" />
      <View
        pointerEvents="none"
        style={[styles.spot, { zIndex: 1, backgroundColor: spotColor }, quality === 'low' && styles.spotLow]}
      />
      {threat ? <View pointerEvents="none" style={[styles.threat, { zIndex: 1 }]} /> : null}

      {/* environment < atmosphere/particles < cards < light foreground dust */}
      <View style={[styles.layer, { zIndex: 2 }]} pointerEvents="none">
        <MineEnvironment depth={roundT} warmth={warmth} threat={threat} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <MineAtmosphere quality={quality} threat={threat} warmth={warmth} />
        <DustMotes count={particleCountFor(quality)} color="rgba(244,215,138,0.9)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <MineForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GoldTone.void },
  fill: { ...StyleSheet.absoluteFillObject },
  layer: { ...StyleSheet.absoluteFillObject },
  spot: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  spotLow: { opacity: 0.45 },
  threat: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(140,18,28,0.18)',
  },
  content: { flex: 1, zIndex: 4 },
});
