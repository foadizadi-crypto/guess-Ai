import React from 'react';
import { StyleSheet, Text, View, type DimensionValue, type FlexStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FindTone } from './searchTokens';

type LostItemHudProps = {
  question: number;
  maxQuestions: number;
  score: number;
  timerLabel: string;
  timeRatio: number;
  rowStyle: ViewStyle;
  glow: boolean;
  urgent?: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
};

function Rivet({ size, style }: { size: number; style?: ViewStyle }) {
  const pit = Math.max(1.6, size * 0.34);
  return (
    <View pointerEvents="none" style={[styles.nodeSeat, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.nodeFill}
      >
        <View style={[styles.nodePit, { width: pit, height: pit, borderRadius: pit / 2 }]} />
      </LinearGradient>
    </View>
  );
}

function CornerTick({
  size,
  thick,
  corner,
}: {
  size: number;
  thick: number;
  corner: 'tl' | 'tr' | 'bl' | 'br';
}) {
  const pos =
    corner === 'tl'
      ? { top: 1, left: 1 }
      : corner === 'tr'
        ? { top: 1, right: 1 }
        : corner === 'bl'
          ? { bottom: 1, left: 1 }
          : { bottom: 1, right: 1 };
  const fromLeft = corner === 'tl' || corner === 'bl';
  const fromTop = corner === 'tl' || corner === 'tr';
  return (
    <View pointerEvents="none" style={[styles.tickSeat, { width: size, height: size }, pos]}>
      <LinearGradient
        colors={fromLeft ? [FindTone.lanternHot, FindTone.brassDeep] : [FindTone.brassDeep, FindTone.lanternHot]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: thick, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [FindTone.brassHot, FindTone.brassDeep] : [FindTone.brassDeep, FindTone.brassHot]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.tickBar, { width: thick, top: 0, bottom: 0 }, fromLeft ? { left: 0 } : { right: 0 }]}
      />
    </View>
  );
}

function SplitLine() {
  return (
    <View style={styles.split}>
      <LinearGradient
        colors={['transparent', 'rgba(255,112,67,0.28)', 'rgba(240,192,120,0.8)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
      <View style={styles.diamond}>
        <LinearGradient
          colors={[FindTone.lanternHot, FindTone.brass, FindTone.brassDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.diamondFill}
        />
      </View>
      <LinearGradient
        colors={['rgba(240,192,120,0.8)', 'rgba(255,112,67,0.28)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.splitArm}
      />
    </View>
  );
}

function ChromePlate({
  label,
  value,
  extra,
  style,
  accent = FindTone.brass,
  glow,
  contentDir,
}: {
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  style?: ViewStyle;
  accent?: string;
  glow: boolean;
  contentDir?: FlexStyle['flexDirection'];
}) {
  return (
    <View style={[styles.plateWrap, style]}>
      <View pointerEvents="none" style={[styles.halo, glow && styles.haloLit]} />
      <LinearGradient
        colors={[FindTone.brassHot, accent, FindTone.brassDeep, accent, FindTone.brassHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(240,192,120,0.5)', 'rgba(42,18,10,0.95)', 'rgba(255,112,67,0.28)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(22,12,8,0.97)', 'rgba(8,4,4,0.98)', 'rgba(18,10,8,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.well}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(240,192,120,0.55)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,112,67,0.28)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.hairLeft}
            />
            <View style={[styles.inlineRow, contentDir ? { flexDirection: contentDir } : null]}>
              <Text style={styles.kicker}>{label}</Text>
              <View style={styles.splitFlex}>
                <SplitLine />
              </View>
              {value}
            </View>
            {extra}
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <CornerTick size={11} thick={2} corner="tl" />
      <CornerTick size={11} thick={2} corner="tr" />
      <CornerTick size={11} thick={2} corner="bl" />
      <CornerTick size={11} thick={2} corner="br" />
      <Rivet size={6} style={{ top: 3.5, left: 3.5 }} />
      <Rivet size={6} style={{ top: 3.5, right: 3.5 }} />
      <Rivet size={6} style={{ bottom: 3.5, left: 3.5 }} />
      <Rivet size={6} style={{ bottom: 3.5, right: 3.5 }} />
    </View>
  );
}

function TimeChannel({ ratio, urgent }: { ratio: number; urgent: boolean }) {
  const fill: DimensionValue = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  return (
    <LinearGradient
      colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep, FindTone.brass]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.channel}
    >
      <View style={styles.channelWell}>
        <LinearGradient
          colors={urgent ? [FindTone.lost, FindTone.lantern] : [FindTone.lanternHot, FindTone.brass, FindTone.lantern]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.channelFill, { width: fill }]}
        />
      </View>
    </LinearGradient>
  );
}

function SearchTicks({
  question,
  maxQuestions,
  contentDir,
}: {
  question: number;
  maxQuestions: number;
  contentDir?: FlexStyle['flexDirection'];
}) {
  return (
    <View style={[styles.ticks, contentDir ? { flexDirection: contentDir } : null]}>
      {Array.from({ length: maxQuestions }, (_, i) => {
        const done = i < question - 1;
        const now = i === question - 1;
        return (
          <LinearGradient
            key={i}
            colors={
              done
                ? [FindTone.found, FindTone.foundDeep]
                : now
                  ? [FindTone.lanternHot, FindTone.lantern]
                  : ['rgba(248,240,230,0.16)', 'rgba(10,6,4,0.7)']
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.tick}
          />
        );
      })}
    </View>
  );
}

export function SearchPrompt({ text, glow }: { text: string; glow: boolean }) {
  return (
    <View style={styles.plateWrap}>
      <View pointerEvents="none" style={[styles.halo, glow && styles.haloLit]} />
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.lantern, FindTone.brassDeep, FindTone.lantern, FindTone.brassHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(240,192,120,0.5)', 'rgba(42,18,10,0.95)', 'rgba(255,112,67,0.28)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(22,12,8,0.97)', 'rgba(8,4,4,0.98)', 'rgba(18,10,8,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.well, { alignItems: 'center' }]}
          >
            <Text style={[styles.value, styles.promptValue]} numberOfLines={1}>
              {text || ' '}
            </Text>
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <Rivet size={6} style={{ top: 3.5, left: 3.5 }} />
      <Rivet size={6} style={{ top: 3.5, right: 3.5 }} />
      <Rivet size={6} style={{ bottom: 3.5, left: 3.5 }} />
      <Rivet size={6} style={{ bottom: 3.5, right: 3.5 }} />
    </View>
  );
}

export function LostItemHud({
  question,
  maxQuestions,
  score,
  timerLabel,
  timeRatio,
  rowStyle,
  glow,
  urgent = false,
  left,
  right,
}: LostItemHudProps) {
  const contentDir = rowStyle.flexDirection;

  return (
    <View style={styles.stack}>
      <View style={[styles.row, rowStyle]}>
        {left}
        <ChromePlate
          label="Lost Item"
          glow={glow}
          contentDir={contentDir}
          style={styles.timePlate}
          accent={urgent ? FindTone.lost : FindTone.brass}
          extra={<TimeChannel ratio={timeRatio} urgent={urgent} />}
          value={
            <Text style={[styles.value, { color: urgent ? FindTone.lost : FindTone.ink }]} numberOfLines={1}>
              {timerLabel}
            </Text>
          }
        />
        {right}
      </View>
      <View style={[styles.row, rowStyle]}>
        <ChromePlate
          label="Find"
          glow={glow}
          contentDir={contentDir}
          style={styles.chip}
          value={
            <Text style={styles.value} numberOfLines={1}>
              {question} of {maxQuestions}
            </Text>
          }
        />
        <View style={styles.tickWrap}>
          <SearchTicks question={question} maxQuestions={maxQuestions} contentDir={contentDir} />
        </View>
        <ChromePlate
          label="Score"
          glow={glow}
          contentDir={contentDir}
          style={styles.chip}
          accent={FindTone.lantern}
          value={
            <Text style={[styles.value, { color: FindTone.lanternHot }]} numberOfLines={1}>
              {score}
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 8, flexShrink: 0 },
  row: { width: '100%', gap: 8, alignItems: 'center' },
  chip: { flex: 1, minWidth: 0 },
  timePlate: { flex: 1, minWidth: 0 },
  tickWrap: { flex: 1.1, minWidth: 72, justifyContent: 'center' },
  plateWrap: {
    position: 'relative',
    shadowColor: FindTone.lantern,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 9,
  },
  halo: {
    position: 'absolute',
    top: -4,
    right: -3,
    bottom: -4,
    left: -3,
    borderRadius: 16,
    backgroundColor: 'rgba(255,112,67,0.16)',
  },
  haloLit: {
    backgroundColor: 'rgba(255,176,136,0.28)',
  },
  bezel: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  lip: {
    margin: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  well: {
    margin: 2.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  hairTop: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: 1.5,
  },
  hairLeft: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 3,
    width: 1.25,
  },
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
  tickSeat: {
    position: 'absolute',
  },
  tickBar: {
    position: 'absolute',
  },
  nodeSeat: {
    position: 'absolute',
    overflow: 'hidden',
  },
  nodeFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePit: {
    backgroundColor: 'rgba(8,4,4,0.84)',
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
  diamond: {
    width: 7,
    height: 7,
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
  },
  diamondFill: {
    flex: 1,
  },
  kicker: {
    color: FindTone.mute,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: FindTone.ink,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(255,112,67,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  promptValue: {
    color: FindTone.lanternHot,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    letterSpacing: 1.2,
    flexShrink: 1,
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
    backgroundColor: 'rgba(8,4,4,0.94)',
    overflow: 'hidden',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
  ticks: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  tick: {
    flex: 1,
    height: 7,
    borderRadius: 3,
  },
});
