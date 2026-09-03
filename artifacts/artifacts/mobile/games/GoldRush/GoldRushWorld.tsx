import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { GoldTone } from './goldTokens';

const VAULT = require('./art/vault.jpg');

type GoldRushWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  threat: boolean;
};

export function GoldRushWorld({ children, quality, threat }: GoldRushWorldProps) {
  return (
    <View style={styles.root}>
      <ExpoImage source={VAULT} style={styles.fill} contentFit="cover" cachePolicy="memory-disk" />
      <LinearGradient
        colors={['rgba(7,4,13,0.55)', 'rgba(7,4,13,0.18)', 'rgba(7,4,13,0.72)']}
        locations={[0, 0.42, 1]}
        style={styles.fill}
      />
      <View style={[styles.spot, quality === 'low' && styles.spotLow]} />
      {threat ? <View style={styles.threat} /> : null}
      <DustMotes count={particleCountFor(quality)} color="rgba(244,215,138,0.55)" />
      <View style={styles.content}>{children}</View>
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
  content: { flex: 1, zIndex: 2 },
});
