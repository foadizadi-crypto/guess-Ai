import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DustMotes, particleCountFor, type VisualQuality } from '@/games/visualFoundation';
import { SpyTone } from './glitchTokens';
import { SpyEnvironment } from './SpyEnvironment';
import { SpyAtmosphere } from './SpyAtmosphere';
import { SpyForeground } from './SpyForeground';

type GlitchSpyWorldProps = {
  children: React.ReactNode;
  quality: VisualQuality;
  urgency?: boolean;
};

export function GlitchSpyWorld({ children, quality, urgency = false }: GlitchSpyWorldProps) {
  const wash = useMemo((): [string, string, string] => {
    if (urgency) {
      return ['rgba(28,8,14,0.78)', 'rgba(34,211,238,0.16)', 'rgba(6,10,14,0.86)'];
    }
    return ['rgba(6,16,22,0.72)', 'rgba(52,245,197,0.12)', 'rgba(3,8,12,0.84)'];
  }, [urgency]);

  const spotColor = urgency ? 'rgba(251,113,133,0.16)' : 'rgba(34,211,238,0.16)';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[SpyTone.void, SpyTone.velvet, '#041016']}
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
        <SpyEnvironment urgency={urgency} />
      </View>

      <View style={[styles.layer, { zIndex: 3 }]} pointerEvents="none">
        <SpyAtmosphere quality={quality} urgency={urgency} />
        <DustMotes count={particleCountFor(quality)} color="rgba(52,245,197,0.9)" />
      </View>

      <View style={styles.content}>{children}</View>

      <View style={[styles.layer, { zIndex: 5 }]} pointerEvents="none">
        <SpyForeground />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SpyTone.void },
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
