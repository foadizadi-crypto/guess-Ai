import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FindTone } from './searchTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type EvidenceMark = 'idle' | 'correct' | 'wrong';

type EvidenceChipProps = {
  uri?: string;
  thumbKey: string;
  disabled: boolean;
  mark: EvidenceMark;
  onPress: () => void;
  onThumbLoad: () => void;
};

function Rivet({ style }: { style: object }) {
  return (
    <View pointerEvents="none" style={[styles.rivet, style]}>
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.rivetFill}
      >
        <View style={styles.rivetPit} />
      </LinearGradient>
    </View>
  );
}

export function EvidenceChip({ uri, thumbKey, disabled, mark, onPress, onThumbLoad }: EvidenceChipProps) {
  const press = useSharedValue(1);
  const accent =
    mark === 'correct' ? FindTone.found : mark === 'wrong' ? FindTone.lost : FindTone.brass;

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.seat, wrapStyle]}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        press.value = withTiming(0.94, { duration: 70 });
      }}
      onPressOut={() => {
        press.value = withSpring(1, { damping: 15, stiffness: 320, mass: 0.42 });
      }}
    >
      <View
        pointerEvents="none"
        style={[
          styles.halo,
          mark === 'correct' && styles.haloFound,
          mark === 'wrong' && styles.haloLost,
        ]}
      />
      <LinearGradient
        colors={[FindTone.brassHot, accent, FindTone.brassDeep, accent, FindTone.brassHot]}
        locations={[0, 0.16, 0.5, 0.84, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(240,192,120,0.42)', 'rgba(26,14,8,0.96)', 'rgba(255,112,67,0.2)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <View style={styles.well}>
            {uri ? (
              <Image
                key={thumbKey}
                source={{ uri }}
                style={styles.thumb}
                resizeMode="cover"
                onLoad={onThumbLoad}
              />
            ) : (
              <View style={styles.empty} />
            )}
          </View>
        </LinearGradient>
      </LinearGradient>
      <Rivet style={styles.rivetTL} />
      <Rivet style={styles.rivetTR} />
      <Rivet style={styles.rivetBL} />
      <Rivet style={styles.rivetBR} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  seat: {
    width: '47%',
    flexGrow: 1,
    aspectRatio: 1,
    position: 'relative',
    shadowColor: FindTone.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 6,
  },
  halo: {
    position: 'absolute',
    top: -3,
    right: -3,
    bottom: -3,
    left: -3,
    borderRadius: 18,
    backgroundColor: 'rgba(255,112,67,0.12)',
  },
  haloFound: {
    backgroundColor: 'rgba(61,220,151,0.28)',
  },
  haloLost: {
    backgroundColor: 'rgba(255,77,109,0.28)',
  },
  bezel: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  lip: {
    flex: 1,
    margin: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  well: {
    flex: 1,
    margin: 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: FindTone.void,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  empty: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rivet: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  rivetFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivetPit: {
    width: 2.4,
    height: 2.4,
    borderRadius: 1.2,
    backgroundColor: 'rgba(8,4,4,0.84)',
  },
  rivetTL: { top: 4, left: 4 },
  rivetTR: { top: 4, right: 4 },
  rivetBL: { bottom: 4, left: 4 },
  rivetBR: { bottom: 4, right: 4 },
});
