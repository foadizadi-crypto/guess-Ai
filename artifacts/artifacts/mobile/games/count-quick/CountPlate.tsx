import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CountTone } from './countTokens';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

function HashTick({ corner }: { corner: Corner }) {
  const pos =
    corner === 'tl'
      ? { top: 3, left: 3 }
      : corner === 'tr'
        ? { top: 3, right: 3 }
        : corner === 'bl'
          ? { bottom: 3, left: 3 }
          : { bottom: 3, right: 3 };
  const fromLeft = corner === 'tl' || corner === 'bl';
  const fromTop = corner === 'tl' || corner === 'tr';
  return (
    <View pointerEvents="none" style={[styles.tickSeat, pos]}>
      <LinearGradient
        colors={fromLeft ? [CountTone.tallyHot, CountTone.tallyDeep] : [CountTone.tallyDeep, CountTone.flash]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: 2, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [CountTone.tallyHot, CountTone.tallyDeep] : [CountTone.tallyDeep, CountTone.flash]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.tickBar, { width: 2, top: 0, bottom: 0 }, fromLeft ? { left: 0 } : { right: 0 }]}
      />
    </View>
  );
}

function Rivet({ style }: { style: object }) {
  return (
    <View pointerEvents="none" style={[styles.rivet, style]}>
      <LinearGradient
        colors={[CountTone.tallyHot, CountTone.tally, CountTone.tallyDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.rivetFill}
      >
        <View style={styles.rivetPit} />
      </LinearGradient>
    </View>
  );
}

type CountPlateProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  accent?: string;
  pad?: boolean;
  fill?: boolean;
};

export function CountPlate({
  children,
  style,
  glow = false,
  accent = CountTone.tally,
  pad = true,
  fill = false,
}: CountPlateProps) {
  return (
    <View style={[styles.wrap, fill && styles.wrapFill, style]}>
      <View pointerEvents="none" style={[styles.halo, glow && styles.haloLit]} />
      <LinearGradient
        colors={[CountTone.tallyHot, accent, CountTone.tallyDeep, accent, CountTone.tallyHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bezel, fill && styles.fill]}
      >
        <LinearGradient
          colors={['rgba(153,246,228,0.42)', 'rgba(15,118,110,0.22)', 'rgba(251,113,133,0.22)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.lip, fill && styles.fill]}
        >
          <LinearGradient
            colors={['rgba(11,28,40,0.97)', 'rgba(6,16,24,0.98)', 'rgba(7,20,30,0.97)']}
            locations={[0, 0.46, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.well, pad ? styles.wellPad : null, fill && styles.fill]}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(244,251,255,0.42)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(45,212,191,0.28)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.hairLeft}
            />
            {children}
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <HashTick corner="tl" />
      <HashTick corner="tr" />
      <HashTick corner="bl" />
      <HashTick corner="br" />
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
    shadowColor: CountTone.tally,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
  },
  wrapFill: {
    minHeight: 0,
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
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    minHeight: 0,
  },
  halo: {
    position: 'absolute',
    top: -4,
    right: -3,
    bottom: -4,
    left: -3,
    borderRadius: 16,
    backgroundColor: 'rgba(45,212,191,0.16)',
  },
  haloLit: {
    backgroundColor: 'rgba(45,212,191,0.3)',
  },
  wellPad: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  hairTop: {
    position: 'absolute',
    top: 2,
    left: 12,
    right: 12,
    height: 1.4,
  },
  hairLeft: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 3,
    width: 1.2,
  },
  tickSeat: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  tickBar: {
    position: 'absolute',
  },
  rivet: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  rivetFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivetPit: {
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
    backgroundColor: 'rgba(6,16,24,0.84)',
  },
  rivetTL: { top: 5, left: 5 },
  rivetTR: { top: 5, right: 5 },
  rivetBL: { bottom: 5, left: 5 },
  rivetBR: { bottom: 5, right: 5 },
});
