import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SpeedTone } from './speedTokens';

type SpeedPromptProps = {
  label: string;
  text: string;
  swatch?: string | null;
};

function Rivet({ style }: { style: object }) {
  return (
    <View pointerEvents="none" style={[styles.rivet, style]}>
      <LinearGradient
        colors={[SpeedTone.snapHot, SpeedTone.ice, SpeedTone.crimsonDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.rivetFill}
      >
        <View style={styles.rivetPit} />
      </LinearGradient>
    </View>
  );
}

export function SpeedPrompt({ label, text, swatch = null }: SpeedPromptProps) {
  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.halo} />
      <LinearGradient
        colors={[SpeedTone.snapHot, SpeedTone.ice, SpeedTone.crimsonDeep, SpeedTone.ice, SpeedTone.snapHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(224,242,254,0.42)', 'rgba(28,10,22,0.95)', 'rgba(125,211,252,0.22)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(22,10,20,0.97)', 'rgba(8,4,14,0.98)']}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(224,242,254,0.45)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <Text style={styles.label}>{label}</Text>
            <View style={styles.row}>
              {swatch ? (
                <LinearGradient
                  colors={[SpeedTone.snapHot, SpeedTone.ice, SpeedTone.crimsonDeep]}
                  style={styles.swatchRing}
                >
                  <View style={[styles.swatch, { backgroundColor: swatch }]} />
                </LinearGradient>
              ) : null}
              <Text style={styles.text} numberOfLines={2}>
                {text}
              </Text>
            </View>
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <Rivet style={styles.rivetTL} />
      <Rivet style={styles.rivetTR} />
      <Rivet style={styles.rivetBL} />
      <Rivet style={styles.rivetBR} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    shadowColor: SpeedTone.ice,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 10,
    elevation: 8,
  },
  halo: {
    position: 'absolute',
    top: -3,
    right: -3,
    bottom: -3,
    left: -3,
    borderRadius: 16,
    backgroundColor: 'rgba(125,211,252,0.14)',
  },
  bezel: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  lip: {
    margin: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  well: {
    margin: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
    overflow: 'hidden',
  },
  hairTop: {
    position: 'absolute',
    top: 2,
    left: 12,
    right: 12,
    height: 1.4,
  },
  label: {
    color: SpeedTone.snapHot,
    fontSize: 11,
    letterSpacing: 1.3,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatchRing: {
    width: 24,
    height: 24,
    borderRadius: 7,
    padding: 2.5,
    flexShrink: 0,
  },
  swatch: {
    flex: 1,
    borderRadius: 4,
  },
  text: {
    flex: 1,
    color: SpeedTone.ink,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  rivet: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  rivetFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rivetPit: { width: 2.4, height: 2.4, borderRadius: 1.2, backgroundColor: 'rgba(8,4,14,0.84)' },
  rivetTL: { top: 4, left: 4 },
  rivetTR: { top: 4, right: 4 },
  rivetBL: { bottom: 4, left: 4 },
  rivetBR: { bottom: 4, right: 4 },
});
