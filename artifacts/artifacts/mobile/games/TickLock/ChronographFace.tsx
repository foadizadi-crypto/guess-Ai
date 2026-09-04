import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TickTone } from './tickTokens';

type ChronographFaceProps = {
  hidden: boolean;
  readout: string | null;
  running: boolean;
  glow: boolean;
};

function DialTick({
  index,
  total,
  radius,
  major,
  hidden,
}: {
  index: number;
  total: number;
  radius: number;
  major: boolean;
  hidden: boolean;
}) {
  const angle = (index / total) * 360;
  const w = major ? 3 : 1.5;
  const h = major ? 12 : 7;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        borderRadius: 1,
        backgroundColor: hidden
          ? major
            ? 'rgba(251,113,133,0.55)'
            : 'rgba(251,113,133,0.22)'
          : major
            ? TickTone.tickHot
            : 'rgba(139,164,184,0.55)',
        transform: [{ rotate: `${angle}deg` }, { translateY: -radius }],
      }}
    />
  );
}

function PadlockMark() {
  return (
    <View style={styles.lockMark} pointerEvents="none">
      <View style={styles.shackle} />
      <LinearGradient
        colors={[TickTone.stopHot, TickTone.stop, TickTone.stopDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.lockBody}
      >
        <View style={styles.keyhole} />
      </LinearGradient>
    </View>
  );
}

function Crown() {
  return (
    <View pointerEvents="none" style={styles.crown}>
      <LinearGradient
        colors={[TickTone.steelHot, TickTone.steel, TickTone.steelDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.crownFill}
      >
        <View style={styles.flute} />
        <View style={[styles.flute, { top: 7 }]} />
        <View style={[styles.flute, { top: 13 }]} />
      </LinearGradient>
    </View>
  );
}

function Lug({ side }: { side: 'left' | 'right' }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={side === 'left' ? [TickTone.steelHot, TickTone.steelDeep] : [TickTone.steelDeep, TickTone.steelHot]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.lug, side === 'left' ? styles.lugLeft : styles.lugRight]}
    />
  );
}

export function ChronographFace({ hidden, readout, running, glow }: ChronographFaceProps) {
  const { width } = useWindowDimensions();
  const size = Math.min(292, Math.max(228, width - 56));
  const pulse = useSharedValue(0.42);

  useEffect(() => {
    pulse.value = running
      ? withRepeat(withTiming(1, { duration: 520, easing: Easing.inOut(Easing.sin) }), -1, true)
      : withTiming(0.45, { duration: 180 });
  }, [pulse, running]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0.42, 1], [glow ? 0.28 : 0.16, glow ? 0.7 : 0.42]),
    transform: [{ scale: interpolate(pulse.value, [0.42, 1], [0.96, 1.06]) }],
  }));

  const ledStyle = useAnimatedStyle(() => ({
    opacity: running ? interpolate(pulse.value, [0.42, 1], [0.35, 1]) : 0.22,
  }));

  const tickCount = 12;
  const dialRadius = size * 0.38;

  return (
    <View style={[styles.stage, { width: size + 28, height: size + 18 }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.halo,
          haloStyle,
          {
            width: size + 36,
            height: size + 36,
            borderRadius: (size + 36) / 2,
            backgroundColor: hidden ? 'rgba(244,63,94,0.38)' : 'rgba(94,234,212,0.32)',
          },
        ]}
      />

      <Lug side="left" />
      <Lug side="right" />
      <Crown />

      <LinearGradient
        colors={[TickTone.steelHot, TickTone.steel, TickTone.steelDeep, TickTone.brassDeep]}
        locations={[0, 0.22, 0.62, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.bezel, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <LinearGradient
          colors={['rgba(232,242,248,0.42)', 'rgba(28,44,58,0.9)', 'rgba(5,8,15,0.96)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.lip, { borderRadius: size / 2 - 6 }]}
        >
          <View style={[styles.dial, { borderRadius: size / 2 - 14 }]}>
            <LinearGradient
              colors={['rgba(12,22,34,0.96)', 'rgba(5,8,15,1)']}
              style={StyleSheet.absoluteFill}
            />
            {Array.from({ length: tickCount }, (_, i) => (
              <DialTick
                key={i}
                index={i}
                total={tickCount}
                radius={dialRadius}
                major={i % 3 === 0}
                hidden={hidden}
              />
            ))}

            <View style={styles.lcdSeat}>
              <LinearGradient
                colors={['rgba(8,4,10,0.96)', 'rgba(6,16,18,0.94)']}
                style={styles.lcdWell}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(232,242,248,0.16)', 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.lcdSheen}
                />
                {hidden || readout == null ? (
                  <View style={styles.hiddenStack}>
                    <PadlockMark />
                    <Text style={styles.hiddenTitle}>TIME HIDDEN</Text>
                    <Text style={styles.hiddenSub}>Stay focused</Text>
                  </View>
                ) : (
                  <View style={styles.readStack}>
                    <Text style={styles.brand}>CHRONO</Text>
                    <Text style={styles.readout} numberOfLines={1}>
                      {readout}
                    </Text>
                    <Text style={styles.unit}>seconds</Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            <Animated.View
              style={[
                styles.led,
                ledStyle,
                { backgroundColor: hidden ? TickTone.stopHot : TickTone.tickHot },
              ]}
            />
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
  bezel: {
    padding: 7,
    overflow: 'hidden',
    shadowColor: TickTone.tick,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 14,
  },
  lip: {
    flex: 1,
    padding: 8,
    overflow: 'hidden',
  },
  dial: {
    flex: 1,
    overflow: 'hidden',
  },
  lcdSeat: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: '32%',
    height: '38%',
  },
  lcdWell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  lcdSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  readStack: {
    alignItems: 'center',
  },
  brand: {
    color: TickTone.mute,
    fontSize: 9,
    letterSpacing: 2.4,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  readout: {
    color: TickTone.tickHot,
    fontSize: 42,
    lineHeight: 48,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(94,234,212,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  unit: {
    color: TickTone.mute,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  hiddenStack: {
    alignItems: 'center',
    gap: 4,
  },
  hiddenTitle: {
    color: TickTone.stopHot,
    fontSize: 13,
    letterSpacing: 1.8,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  hiddenSub: {
    color: 'rgba(251,113,133,0.78)',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  lockMark: {
    alignItems: 'center',
    marginBottom: 2,
  },
  shackle: {
    width: 18,
    height: 12,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: TickTone.stopHot,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  lockBody: {
    width: 26,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
  },
  keyhole: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(8,4,10,0.85)',
  },
  led: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 18,
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: TickTone.tickHot,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  crown: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 22,
    borderRadius: 4,
    overflow: 'hidden',
    zIndex: 3,
  },
  crownFill: {
    flex: 1,
    paddingVertical: 3,
    justifyContent: 'center',
    gap: 2,
  },
  flute: {
    height: 1.5,
    marginHorizontal: 3,
    borderRadius: 1,
    backgroundColor: 'rgba(5,8,15,0.55)',
  },
  lug: {
    position: 'absolute',
    width: 16,
    height: 28,
    borderRadius: 4,
    top: '50%',
    marginTop: -14,
    zIndex: 0,
  },
  lugLeft: {
    left: 0,
  },
  lugRight: {
    right: 0,
  },
});
