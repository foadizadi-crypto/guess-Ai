import React from 'react';
import { StyleSheet, Text, View, type DimensionValue, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CountTone } from './countTokens';
import { CountPlate } from './CountPlate';

type CountQuickHudProps = {
  round: number;
  maxRounds: number;
  score: number;
  secondsLeft: number;
  timeRatio: number;
  showTimer: boolean;
  glow: boolean;
};

function SplitLine() {
  return (
    <View style={styles.split}>
      <LinearGradient
        colors={['transparent', 'rgba(45,212,191,0.28)', 'rgba(251,113,133,0.7)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
      <View style={styles.slash}>
        <LinearGradient
          colors={[CountTone.tallyHot, CountTone.flash, CountTone.tallyDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.slashFill}
        />
      </View>
      <LinearGradient
        colors={['rgba(251,113,133,0.7)', 'rgba(45,212,191,0.28)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
    </View>
  );
}

function TallyRow({ round, maxRounds }: { round: number; maxRounds: number }) {
  return (
    <View style={styles.tallyRow}>
      {Array.from({ length: maxRounds }, (_, i) => {
        const done = i < round - 1;
        const now = i === round - 1;
        return (
          <View
            key={i}
            style={[
              styles.tallyStroke,
              done && styles.tallyDone,
              now && styles.tallyNow,
            ]}
          />
        );
      })}
    </View>
  );
}

function TimeChannel({ ratio, urgent }: { ratio: number; urgent: boolean }) {
  const fill: DimensionValue = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  return (
    <LinearGradient
      colors={[CountTone.tallyHot, CountTone.tally, CountTone.tallyDeep, CountTone.tally]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.channel}
    >
      <View style={styles.channelWell}>
        <LinearGradient
          colors={urgent ? [CountTone.flashHot, CountTone.flash] : [CountTone.tallyHot, CountTone.tally, CountTone.amber]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.channelFill, { width: fill }]}
        />
      </View>
    </LinearGradient>
  );
}

function Meter({
  label,
  value,
  extra,
  style,
  accent = CountTone.tally,
  glow,
}: {
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  style?: ViewStyle;
  accent?: string;
  glow: boolean;
}) {
  return (
    <CountPlate style={style} glow={glow} accent={accent}>
      <View style={styles.inlineRow}>
        <Text style={styles.kicker}>{label}</Text>
        <View style={styles.splitFlex}>
          <SplitLine />
        </View>
        {value}
      </View>
      {extra}
    </CountPlate>
  );
}

export function CountQuickHud({
  round,
  maxRounds,
  score,
  secondsLeft,
  timeRatio,
  showTimer,
  glow,
}: CountQuickHudProps) {
  const urgent = showTimer && secondsLeft <= 1;

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <Meter
          label="Set"
          glow={glow}
          style={styles.chip}
          extra={<TallyRow round={round} maxRounds={maxRounds} />}
          value={
            <Text style={styles.value} numberOfLines={1}>
              {round} of {maxRounds}
            </Text>
          }
        />
        <Meter
          label="Score"
          glow={glow}
          style={styles.chip}
          accent={CountTone.amber}
          value={
            <Text style={[styles.value, { color: CountTone.amberHot }]} numberOfLines={1}>
              {score}
            </Text>
          }
        />
      </View>
      <Meter
        label={showTimer ? 'Look' : 'Lock'}
        glow={glow}
        style={styles.timePlate}
        accent={urgent ? CountTone.flash : CountTone.tally}
        extra={showTimer ? <TimeChannel ratio={timeRatio} urgent={urgent} /> : null}
        value={
          <Text
            style={[styles.value, { color: urgent ? CountTone.flashHot : CountTone.ink }]}
            numberOfLines={1}
          >
            {showTimer ? `${secondsLeft}s` : 'Your answer'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 8, flexShrink: 0 },
  row: { width: '100%', gap: 8, flexDirection: 'row' },
  chip: { flex: 1, minWidth: 0 },
  timePlate: { width: '100%' },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  splitFlex: {
    flex: 1,
    minWidth: 10,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8,
    gap: 3,
  },
  splitArm: {
    flex: 1,
    height: 1.5,
  },
  slash: {
    width: 10,
    height: 2.4,
    transform: [{ rotate: '-48deg' }],
    overflow: 'hidden',
    borderRadius: 1,
  },
  slashFill: {
    flex: 1,
  },
  kicker: {
    color: CountTone.mute,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: CountTone.ink,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(45,212,191,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  tallyRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 5,
    height: 14,
    alignItems: 'flex-end',
  },
  tallyStroke: {
    flex: 1,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: 'rgba(244,251,255,0.14)',
  },
  tallyDone: {
    backgroundColor: CountTone.tally,
    height: 12,
  },
  tallyNow: {
    backgroundColor: CountTone.flash,
    height: 14,
  },
  channel: {
    marginTop: 6,
    height: 6,
    borderRadius: 4,
    padding: 1.25,
    overflow: 'hidden',
  },
  channelWell: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(6,16,24,0.94)',
    overflow: 'hidden',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
});
