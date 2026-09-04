/**
 * SpyMatrix — dual-grid CRT frames.
 * Both matrices MUST use this same chrome. Tiles are visually identical.
 * Never accept or style an odd/glitch index — that is the puzzle.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SpyTone } from './glitchTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TILE_GAP = 4;
const FRAME_PAD = 10;

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
      ? { top: 2, left: 2 }
      : corner === 'tr'
        ? { top: 2, right: 2 }
        : corner === 'bl'
          ? { bottom: 2, left: 2 }
          : { bottom: 2, right: 2 };
  const fromLeft = corner === 'tl' || corner === 'bl';
  const fromTop = corner === 'tl' || corner === 'tr';
  return (
    <View pointerEvents="none" style={[styles.tickSeat, { width: size, height: size }, pos]}>
      <LinearGradient
        colors={fromLeft ? [SpyTone.phosphor, SpyTone.cyanDeep] : [SpyTone.cyanDeep, SpyTone.phosphor]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: thick, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [SpyTone.cyanHot, SpyTone.cyanDeep] : [SpyTone.cyanDeep, SpyTone.cyanHot]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.tickBar, { width: thick, top: 0, bottom: 0 }, fromLeft ? { left: 0 } : { right: 0 }]}
      />
    </View>
  );
}

function StatusPip({ style }: { style: object }) {
  return (
    <View pointerEvents="none" style={[styles.pipSeat, style]}>
      <LinearGradient
        colors={[SpyTone.phosphorHot, SpyTone.cyan, SpyTone.phosphorDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.pipFill}
      >
        <View style={styles.pipPit} />
      </LinearGradient>
    </View>
  );
}

function FrameSweep({ width, height }: { width: number; height: number }) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
  }, [y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value * Math.max(8, height - 3) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 8, width: Math.max(0, width - 16), top: 8, height: 2 }, style]}
    >
      <LinearGradient
        colors={['rgba(52,245,197,0)', 'rgba(52,245,197,0.7)', 'rgba(34,211,238,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

function MatrixTile({
  glyph,
  size,
  fontSize,
  interactive,
  onPress,
}: {
  glyph: string;
  size: number;
  fontSize: number;
  interactive: boolean;
  onPress?: () => void;
}) {
  const press = useSharedValue(1);
  const radius = Math.max(8, size * 0.16);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const face = (
    <LinearGradient
      colors={['#16323A', '#0B1C22', '#071318']}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.tileFace, { width: size, height: size, borderRadius: radius }]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(154,255,230,0.28)', 'transparent']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.55 }}
        style={styles.tileSheen}
      />
      <Text style={[styles.tileGlyph, { fontSize }]}>{glyph}</Text>
    </LinearGradient>
  );

  if (!interactive) {
    return <View style={{ width: size, height: size }}>{face}</View>;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.94, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      style={[{ width: size, height: size }, pressStyle]}
    >
      {face}
    </AnimatedPressable>
  );
}

type SpyMatrixProps = {
  label: string;
  glyphs: string[];
  width: number;
  tileSize: number;
  fontSize: number;
  interactive: boolean;
  onPressTile?: (index: number) => void;
};

export function SpyMatrix({
  label,
  glyphs,
  width,
  tileSize,
  fontSize,
  interactive,
  onPressTile,
}: SpyMatrixProps) {
  const columns = Math.max(1, Math.round(Math.sqrt(glyphs.length)));
  const rows = Math.max(1, Math.ceil(glyphs.length / columns));
  const gridH = rows * tileSize + TILE_GAP * Math.max(0, rows - 1);
  const frameH = 28 + FRAME_PAD * 2 + gridH;

  return (
    <View style={[styles.frameWrap, { width }]}>
      <View pointerEvents="none" style={styles.halo} />
      <LinearGradient
        colors={[SpyTone.phosphorHot, SpyTone.cyan, SpyTone.cyanDeep, SpyTone.cyan, SpyTone.phosphorHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(154,255,230,0.4)', 'rgba(8,28,36,0.96)', 'rgba(34,211,238,0.22)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['rgba(8,22,28,0.98)', 'rgba(3,8,12,0.98)', 'rgba(6,18,24,0.97)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.well}
          >
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.grid, { width: columns * tileSize + TILE_GAP * (columns - 1) }]}>
              {glyphs.map((glyph, idx) => (
                <MatrixTile
                  key={`${label}-${idx}`}
                  glyph={glyph}
                  size={tileSize}
                  fontSize={fontSize}
                  interactive={interactive}
                  onPress={onPressTile ? () => onPressTile(idx) : undefined}
                />
              ))}
            </View>
            <FrameSweep width={width - 10} height={frameH - 16} />
          </LinearGradient>
        </LinearGradient>
      </LinearGradient>
      <CornerTick size={14} thick={2.25} corner="tl" />
      <CornerTick size={14} thick={2.25} corner="tr" />
      <CornerTick size={14} thick={2.25} corner="bl" />
      <CornerTick size={14} thick={2.25} corner="br" />
      <StatusPip style={{ top: 5, left: 5 }} />
      <StatusPip style={{ top: 5, right: 5 }} />
      <StatusPip style={{ bottom: 5, left: 5 }} />
      <StatusPip style={{ bottom: 5, right: 5 }} />
    </View>
  );
}

export function SpySync() {
  return (
    <View style={styles.sync} pointerEvents="none">
      <LinearGradient
        colors={['transparent', 'rgba(52,245,197,0.7)', 'transparent']}
        style={styles.syncArm}
      />
      <View style={styles.syncJewel}>
        <LinearGradient
          colors={[SpyTone.phosphorHot, SpyTone.cyan, SpyTone.cyanDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.syncJewelFill}
        />
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(34,211,238,0.7)', 'transparent']}
        style={styles.syncArm}
      />
    </View>
  );
}

export const SPY_TILE_GAP = TILE_GAP;
export const SPY_FRAME_PAD = FRAME_PAD;

const styles = StyleSheet.create({
  frameWrap: {
    position: 'relative',
    shadowColor: SpyTone.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 8,
  },
  halo: {
    position: 'absolute',
    top: -5,
    right: -4,
    bottom: -5,
    left: -4,
    borderRadius: 18,
    backgroundColor: 'rgba(34,211,238,0.14)',
  },
  bezel: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  lip: {
    margin: 1.75,
    borderRadius: 14,
    overflow: 'hidden',
  },
  well: {
    margin: 2.5,
    borderRadius: 12,
    paddingTop: 8,
    paddingBottom: FRAME_PAD,
    paddingHorizontal: FRAME_PAD,
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    color: SpyTone.mute,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tileFace: {
    borderWidth: 1,
    borderColor: 'rgba(52,245,197,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tileSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  tileGlyph: {
    textAlign: 'center',
  },
  tickSeat: {
    position: 'absolute',
  },
  tickBar: {
    position: 'absolute',
  },
  pipSeat: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  pipFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipPit: {
    width: 2.4,
    height: 2.4,
    borderRadius: 1.2,
    backgroundColor: 'rgba(3,8,12,0.84)',
  },
  sync: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    gap: 0,
  },
  syncArm: {
    width: 2,
    flex: 1,
    minHeight: 5,
  },
  syncJewel: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    overflow: 'hidden',
  },
  syncJewelFill: {
    flex: 1,
  },
});
