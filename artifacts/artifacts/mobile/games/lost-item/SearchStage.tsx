import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FindTone } from './searchTokens';

type SearchStageProps = {
  uri?: string;
  sceneKey: string;
  blackout: boolean;
  loading: boolean;
  loadError: string | null;
  onSceneLoad: () => void;
  retry?: React.ReactNode;
};

function Rivet({ size, style }: { size: number; style?: object }) {
  const pit = Math.max(1.6, size * 0.34);
  return (
    <View pointerEvents="none" style={[styles.rivetSeat, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.rivetFill}
      >
        <View style={[styles.rivetPit, { width: pit, height: pit, borderRadius: pit / 2 }]} />
      </LinearGradient>
    </View>
  );
}

function CornerTick({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const pos =
    corner === 'tl'
      ? { top: 5, left: 5 }
      : corner === 'tr'
        ? { top: 5, right: 5 }
        : corner === 'bl'
          ? { bottom: 5, left: 5 }
          : { bottom: 5, right: 5 };
  const fromLeft = corner === 'tl' || corner === 'bl';
  const fromTop = corner === 'tl' || corner === 'tr';
  return (
    <View pointerEvents="none" style={[styles.tickSeat, pos]}>
      <LinearGradient
        colors={fromLeft ? [FindTone.lanternHot, FindTone.brassDeep] : [FindTone.brassDeep, FindTone.lanternHot]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.tickBar, { height: 2.2, left: 0, right: 0 }, fromTop ? { top: 0 } : { bottom: 0 }]}
      />
      <LinearGradient
        colors={fromTop ? [FindTone.brassHot, FindTone.brassDeep] : [FindTone.brassDeep, FindTone.brassHot]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.tickBar, { width: 2.2, top: 0, bottom: 0 }, fromLeft ? { left: 0 } : { right: 0 }]}
      />
    </View>
  );
}

export function SearchStage({
  uri,
  sceneKey,
  blackout,
  loading,
  loadError,
  onSceneLoad,
  retry,
}: SearchStageProps) {
  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.halo} />
      <LinearGradient
        colors={[FindTone.brassHot, FindTone.brass, FindTone.brassDeep, FindTone.lantern, FindTone.brassHot]}
        locations={[0, 0.18, 0.5, 0.82, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(240,192,120,0.5)', 'rgba(26,14,8,0.96)', 'rgba(255,112,67,0.24)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <View style={styles.well}>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(240,192,120,0.28)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.hairTop}
            />
            {loading || !uri ? (
              <LinearGradient colors={[FindTone.velvet, FindTone.void]} style={styles.scene}>
                <Text style={styles.status}>{loadError ?? 'Lost Item'}</Text>
                {loadError ? retry : null}
              </LinearGradient>
            ) : blackout ? (
              <View style={styles.blackout}>
                <LinearGradient
                  colors={['rgba(255,112,67,0.08)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.55)']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Text style={styles.blackoutLabel}>Lights out</Text>
              </View>
            ) : (
              <Image
                key={sceneKey}
                source={{ uri }}
                style={styles.scene}
                resizeMode="cover"
                onLoad={onSceneLoad}
              />
            )}
          </View>
        </LinearGradient>
      </LinearGradient>
      <CornerTick corner="tl" />
      <CornerTick corner="tr" />
      <CornerTick corner="bl" />
      <CornerTick corner="br" />
      <Rivet size={8} style={styles.rivetTL} />
      <Rivet size={8} style={styles.rivetTR} />
      <Rivet size={8} style={styles.rivetBL} />
      <Rivet size={8} style={styles.rivetBR} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 220,
    position: 'relative',
    shadowColor: FindTone.lantern,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  halo: {
    position: 'absolute',
    top: -5,
    right: -4,
    bottom: -5,
    left: -4,
    borderRadius: 26,
    backgroundColor: 'rgba(255,112,67,0.16)',
  },
  bezel: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  lip: {
    flex: 1,
    margin: 3,
    borderRadius: 21,
    overflow: 'hidden',
  },
  well: {
    flex: 1,
    margin: 4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: FindTone.void,
  },
  hairTop: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    zIndex: 2,
  },
  scene: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  blackout: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackoutLabel: {
    color: FindTone.mute,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
  },
  status: {
    color: FindTone.ink,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 18,
  },
  tickSeat: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  tickBar: {
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
    backgroundColor: 'rgba(8,4,4,0.84)',
  },
  rivetTL: { top: 8, left: 8 },
  rivetTR: { top: 8, right: 8 },
  rivetBL: { bottom: 8, left: 8 },
  rivetBR: { bottom: 8, right: 8 },
});
