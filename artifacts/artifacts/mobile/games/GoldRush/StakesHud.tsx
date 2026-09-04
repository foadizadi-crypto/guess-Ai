import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type FlexStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GoldTone } from './goldTokens';

type StakesHudProps = {
  round: number;
  maxRounds: number;
  correct: number;
  wrong: number;
  currentPot: number;
  timerSeconds: number;
  rowStyle: ViewStyle;
  blur: boolean;
  compact?: boolean;
};

function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function Rivet({ size, style }: { size: number; style?: ViewStyle }) {
  const pit = Math.max(1.75, size * 0.36);
  return (
    <View pointerEvents="none" style={[styles.rivetSeat, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={[GoldTone.metalHot, GoldTone.metal, GoldTone.metalDeep]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={styles.rivetFill}
      >
        <View style={[styles.rivetPit, { width: pit, height: pit, borderRadius: pit / 2 }]} />
      </LinearGradient>
    </View>
  );
}

function CornerCap({
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
    <View pointerEvents="none" style={[styles.capSeat, { width: size, height: size }, pos]}>
      <LinearGradient
        colors={fromLeft ? [GoldTone.metalHot, GoldTone.metalDeep] : [GoldTone.metalDeep, GoldTone.metalHot]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          styles.capBar,
          { height: thick, left: 0, right: 0 },
          fromTop ? { top: 0 } : { bottom: 0 },
        ]}
      />
      <LinearGradient
        colors={fromTop ? [GoldTone.metalHot, GoldTone.metalDeep] : [GoldTone.metalDeep, GoldTone.metalHot]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.capBar,
          { width: thick, top: 0, bottom: 0 },
          fromLeft ? { left: 0 } : { right: 0 },
        ]}
      />
    </View>
  );
}

function EngravedDivider({ compact, flex }: { compact?: boolean; flex?: boolean }) {
  const gem = compact ? 4 : 6;
  return (
    <View style={[styles.divider, compact && styles.dividerCompact, flex && styles.dividerFlex]}>
      <LinearGradient
        colors={['transparent', 'rgba(244,215,138,0.2)', 'rgba(244,215,138,0.72)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerArm}
      />
      <View style={[styles.gemSeat, { width: gem + 3, height: gem + 3 }]}>
        <View style={[styles.gem, { width: gem, height: gem }]}>
          <LinearGradient
            colors={[GoldTone.metalHot, GoldTone.ember, GoldTone.metalDeep]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.gemFill}
          />
        </View>
      </View>
      <LinearGradient
        colors={['rgba(244,215,138,0.72)', 'rgba(244,215,138,0.2)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.dividerArm}
      />
    </View>
  );
}

function VaultPlate({
  label,
  value,
  extra,
  style,
  accent = GoldTone.metal,
  glow,
  compact,
  inline,
  contentDir,
}: {
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  style?: ViewStyle;
  accent?: string;
  glow: boolean;
  compact?: boolean;
  inline?: boolean;
  contentDir?: FlexStyle['flexDirection'];
}) {
  const rivet = compact ? 4.5 : 6.5;
  const cap = compact ? 8 : 12;
  const capThick = compact ? 1.75 : 2.25;
  const kickerStyle = compact ? styles.kickerCompact : styles.kicker;
  const inset = compact ? 2.5 : 3.5;

  return (
    <View style={[styles.plateWrap, compact && styles.plateWrapCompact, style]}>
      <View
        pointerEvents="none"
        style={[styles.amberHalo, compact && styles.amberHaloCompact, glow && styles.amberHaloLit]}
      />
      <LinearGradient
        colors={[GoldTone.metalHot, accent, GoldTone.metalDeep, accent, GoldTone.metalHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bezel, compact && styles.bezelCompact]}
      >
        <LinearGradient
          colors={['rgba(244,215,138,0.55)', 'rgba(70,42,12,0.95)', 'rgba(244,215,138,0.28)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.lip, compact && styles.lipCompact]}
        >
          <LinearGradient
            colors={['rgba(42,24,10,0.97)', 'rgba(10,6,12,0.98)', 'rgba(16,9,6,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.well, compact && styles.wellCompact]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(244,215,138,0.55)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(244,215,138,0.22)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.hairLeft}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', 'rgba(244,215,138,0.2)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairBottom}
            />
            {inline ? (
              <View style={[styles.inlineRow, contentDir ? { flexDirection: contentDir } : null]}>
                <Text style={kickerStyle}>{label}</Text>
                <EngravedDivider compact={compact} flex />
                {value}
              </View>
            ) : (
              <View style={styles.stackInner}>
                <Text style={[kickerStyle, styles.kickerCenter]}>{label}</Text>
                <EngravedDivider compact={compact} />
                {value}
              </View>
            )}
            {extra}
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <CornerCap size={cap} thick={capThick} corner="tl" />
      <CornerCap size={cap} thick={capThick} corner="tr" />
      <CornerCap size={cap} thick={capThick} corner="bl" />
      <CornerCap size={cap} thick={capThick} corner="br" />
      <Rivet size={rivet} style={{ top: inset, left: inset }} />
      <Rivet size={rivet} style={{ top: inset, right: inset }} />
      <Rivet size={rivet} style={{ bottom: inset, left: inset }} />
      <Rivet size={rivet} style={{ bottom: inset, right: inset }} />
    </View>
  );
}

function GoldChannel({ ratio, compact }: { ratio: number; compact?: boolean }) {
  return (
    <LinearGradient
      colors={[GoldTone.metalHot, GoldTone.metal, GoldTone.metalDeep, GoldTone.metal]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.channel, compact && styles.channelCompact]}
    >
      <View style={styles.channelWell}>
        <LinearGradient
          colors={[GoldTone.metalDeep, GoldTone.metal, GoldTone.metalHot]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.channelFill, { width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` }]}
        />
      </View>
    </LinearGradient>
  );
}

export function StakesHud({
  round,
  maxRounds,
  correct,
  wrong,
  currentPot,
  timerSeconds,
  rowStyle,
  blur,
  compact = false,
}: StakesHudProps) {
  const potScale = useSharedValue(1);
  useEffect(() => {
    potScale.value = 1.08;
    potScale.value = withSpring(1, { damping: 12, stiffness: 220 });
  }, [currentPot, potScale]);

  const potStyle = useAnimatedStyle(() => ({ transform: [{ scale: potScale.value }] }));
  const roundRatio = maxRounds > 0 ? Math.min(1, round / maxRounds) : 0;
  const valueStyle = compact ? styles.valueCompact : styles.value;
  const contentDir = rowStyle.flexDirection;

  const potExtra = (
    <>
      <Text style={compact ? styles.warnCompact : styles.warn}>
        A bomb wipes this Pot. Continue keeps it. Cash Out banks it.
      </Text>
      <GoldChannel ratio={roundRatio} compact={compact} />
    </>
  );

  return (
    <View style={[styles.stack, compact && styles.stackCompact]}>
      <View style={[styles.row, compact && styles.rowCompact, rowStyle]}>
        <VaultPlate
          label="Round"
          glow={blur}
          compact={compact}
          inline={compact}
          contentDir={contentDir}
          style={styles.chip}
          value={
            <Text style={valueStyle} numberOfLines={1}>
              {round} of {maxRounds}
            </Text>
          }
        />
        <VaultPlate
          label="Time"
          glow={blur}
          compact={compact}
          inline={compact}
          contentDir={contentDir}
          style={styles.chip}
          accent={GoldTone.bank}
          value={
            <Text
              style={[valueStyle, { color: timerSeconds <= 10 ? GoldTone.ember : GoldTone.bank }]}
              numberOfLines={1}
            >
              {formatTimer(timerSeconds)}
            </Text>
          }
        />
      </View>
      <View style={[styles.row, compact && styles.rowCompact, rowStyle]}>
        <VaultPlate
          label="Correct"
          glow={blur}
          compact={compact}
          inline={compact}
          contentDir={contentDir}
          style={styles.chip}
          value={<Text style={valueStyle}>{correct}</Text>}
        />
        <VaultPlate
          label="Wrong"
          glow={blur}
          compact={compact}
          inline={compact}
          contentDir={contentDir}
          style={styles.chip}
          accent={GoldTone.ember}
          value={<Text style={[valueStyle, { color: GoldTone.ember }]}>{wrong}</Text>}
        />
      </View>

      <VaultPlate
        label="Pot"
        glow={blur}
        compact={compact}
        inline={compact}
        contentDir={contentDir}
        style={styles.potPlate}
        accent={GoldTone.metalHot}
        extra={potExtra}
        value={
          compact ? (
            <Animated.Text style={[styles.potCompact, potStyle]}>{currentPot}</Animated.Text>
          ) : (
            <Animated.Text style={[styles.pot, potStyle]}>{currentPot}</Animated.Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { width: '100%', gap: 8, flexShrink: 0 },
  stackCompact: { gap: 5 },
  row: { width: '100%', gap: 8 },
  rowCompact: { gap: 5 },
  chip: { flex: 1, minWidth: 0 },
  potPlate: { width: '100%' },
  plateWrap: {
    position: 'relative',
    shadowColor: GoldTone.metalHot,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 12,
    elevation: 9,
  },
  plateWrapCompact: {
    shadowRadius: 8,
    elevation: 7,
  },
  amberHalo: {
    position: 'absolute',
    top: -5,
    right: -4,
    bottom: -5,
    left: -4,
    borderRadius: 18,
    backgroundColor: 'rgba(201,162,74,0.2)',
  },
  amberHaloCompact: {
    top: -3,
    right: -2,
    bottom: -3,
    left: -2,
    borderRadius: 14,
    backgroundColor: 'rgba(201,162,74,0.16)',
  },
  amberHaloLit: {
    backgroundColor: 'rgba(244,215,138,0.3)',
  },
  bezel: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  bezelCompact: {
    borderRadius: 11,
  },
  lip: {
    margin: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lipCompact: {
    margin: 1,
    borderRadius: 9,
  },
  well: {
    margin: 2.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  wellCompact: {
    margin: 2,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
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
  hairBottom: {
    position: 'absolute',
    bottom: 2,
    left: 10,
    right: 10,
    height: 1,
  },
  stackInner: {
    alignItems: 'center',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  capSeat: {
    position: 'absolute',
  },
  capBar: {
    position: 'absolute',
  },
  rivetSeat: {
    position: 'absolute',
    overflow: 'hidden',
  },
  rivetFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivetPit: {
    backgroundColor: 'rgba(14,8,4,0.82)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    height: 10,
    marginVertical: 2,
    gap: 4,
  },
  dividerCompact: {
    height: 8,
    marginVertical: 0,
    gap: 3,
  },
  dividerFlex: {
    flex: 1,
    minWidth: 10,
    alignSelf: 'auto',
  },
  dividerArm: {
    flex: 1,
    height: 1.5,
  },
  gemSeat: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gem: {
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
  },
  gemFill: {
    flex: 1,
  },
  kicker: {
    color: GoldTone.mute,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
  },
  kickerCenter: {
    textAlign: 'center',
  },
  kickerCompact: {
    color: GoldTone.mute,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },
  value: {
    color: GoldTone.ink,
    fontSize: 21,
    lineHeight: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(244,215,138,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  valueCompact: {
    color: GoldTone.ink,
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(244,215,138,0.28)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  pot: {
    color: GoldTone.metalHot,
    fontSize: 38,
    lineHeight: 44,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(244,215,138,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  potCompact: {
    color: GoldTone.metalHot,
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(244,215,138,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  warn: {
    color: GoldTone.ember,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter_500Medium',
  },
  warnCompact: {
    color: GoldTone.ember,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 3,
    fontFamily: 'Inter_500Medium',
  },
  channel: {
    marginTop: 8,
    height: 7,
    borderRadius: 4,
    padding: 1.5,
    overflow: 'hidden',
  },
  channelCompact: {
    marginTop: 4,
    height: 5,
    borderRadius: 3,
    padding: 1,
  },
  channelWell: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(8,5,10,0.94)',
    overflow: 'hidden',
  },
  channelFill: {
    height: '100%',
    borderRadius: 2,
  },
});
