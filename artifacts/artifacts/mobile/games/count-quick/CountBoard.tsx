import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { CountQuickItem } from './engine';
import { CountChip } from './CountChip';
import { CountTone } from './countTokens';

type CountBoardProps = {
  items: CountQuickItem[];
};

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

export function CountBoard({ items }: CountBoardProps) {
  return (
    <View style={styles.stage}>
      <View pointerEvents="none" style={styles.halo} />
      <LinearGradient
        colors={[CountTone.tallyHot, CountTone.tally, CountTone.tallyDeep, CountTone.flash, CountTone.tallyHot]}
        locations={[0, 0.18, 0.5, 0.82, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.bezel}
      >
        <LinearGradient
          colors={['rgba(153,246,228,0.32)', 'rgba(7,20,30,0.94)', 'rgba(251,113,133,0.18)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.lip}
        >
          <LinearGradient
            colors={['#163A42', '#0D242C', '#0A1C24']}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.felt}
          >
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(244,251,255,0.16)', 'transparent']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 0.45 }}
              style={styles.sheen}
            />
            <View pointerEvents="none" style={styles.stitch} />
            <View style={styles.scatter}>
              {items.map((item, itemIndex) => (
                <CountChip
                  key={`${item.shape}-${item.color}-${itemIndex}`}
                  shape={item.shape}
                  color={item.color}
                  size={46}
                  index={itemIndex}
                />
              ))}
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

export function CountAskStage({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.askStage}>
      <View pointerEvents="none" style={styles.halo} />
      <LinearGradient
        colors={[CountTone.tallyHot, CountTone.tallyDeep, CountTone.flash, CountTone.tally]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.askBezel}
      >
        <LinearGradient colors={['rgba(11,28,40,0.92)', 'rgba(6,16,24,0.96)']} style={styles.askWell}>
          {children}
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 180,
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    top: -5,
    right: -4,
    bottom: -5,
    left: -4,
    borderRadius: 32,
    backgroundColor: 'rgba(45,212,191,0.14)',
  },
  bezel: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  lip: {
    flex: 1,
    margin: 2.5,
    borderRadius: 25,
    overflow: 'hidden',
  },
  felt: {
    flex: 1,
    margin: 3,
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 180,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  stitch: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(45,212,191,0.18)',
  },
  scatter: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  rivet: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rivetFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rivetPit: { width: 2.6, height: 2.6, borderRadius: 1.3, backgroundColor: 'rgba(6,16,24,0.84)' },
  rivetTL: { top: 8, left: 8 },
  rivetTR: { top: 8, right: 8 },
  rivetBL: { bottom: 8, left: 8 },
  rivetBR: { bottom: 8, right: 8 },
  askStage: {
    flex: 1,
    minHeight: 180,
    justifyContent: 'center',
    position: 'relative',
  },
  askBezel: {
    flex: 1,
    borderRadius: 28,
    padding: 3,
    overflow: 'hidden',
  },
  askWell: {
    flex: 1,
    borderRadius: 25,
    padding: 14,
    gap: 14,
    justifyContent: 'center',
  },
});
