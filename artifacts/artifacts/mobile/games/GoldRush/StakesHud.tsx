import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { HudPlate } from '@/games/visualFoundation';
import { GoldTone } from './goldTokens';

type StakesHudProps = {
  round: number;
  maxRounds: number;
  savedScore: number;
  currentPot: number;
  rowStyle: ViewStyle;
  blur: boolean;
};

export function StakesHud({ round, maxRounds, savedScore, currentPot, rowStyle, blur }: StakesHudProps) {
  const potScale = useSharedValue(1);
  useEffect(() => {
    potScale.value = 1.08;
    potScale.value = withSpring(1, { damping: 12, stiffness: 220 });
  }, [currentPot, potScale]);

  const potStyle = useAnimatedStyle(() => ({ transform: [{ scale: potScale.value }] }));
  const roundRatio = maxRounds > 0 ? Math.min(1, round / maxRounds) : 0;

  return (
    <View style={styles.stack}>
      <View style={[styles.row, rowStyle]}>
        <HudPlate blur={blur} style={styles.chip}>
          <Text style={styles.kicker}>Round</Text>
          <Text style={styles.value}>
            {round} of {maxRounds}
          </Text>
        </HudPlate>
        <HudPlate blur={blur} style={styles.chip} border="rgba(215,232,168,0.28)">
          <Text style={styles.kicker}>Banked score (locked)</Text>
          <Text style={[styles.value, { color: GoldTone.bank }]}>{savedScore}</Text>
        </HudPlate>
      </View>

      <HudPlate blur={blur} style={styles.potPlate} fill={['rgba(28,16,8,0.78)', 'rgba(12,8,16,0.78)']}>
        <Text style={styles.kicker}>This round's risk score</Text>
        <Animated.Text style={[styles.pot, potStyle]}>{currentPot}</Animated.Text>
        <Text style={styles.warn}>If you hit a bomb, this score is gone!</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(roundRatio * 100)}%` }]} />
        </View>
      </HudPlate>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 10 },
  row: { width: '100%', gap: 10 },
  chip: { flex: 1 },
  potPlate: { width: '100%' },
  kicker: {
    color: GoldTone.mute,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  value: {
    color: GoldTone.ink,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  pot: {
    color: GoldTone.metalHot,
    fontSize: 40,
    lineHeight: 46,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  warn: {
    color: GoldTone.ember,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter_500Medium',
  },
  track: {
    marginTop: 10,
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  fill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: GoldTone.metal,
  },
});
