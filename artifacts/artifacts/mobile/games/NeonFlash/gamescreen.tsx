import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSimonFlow } from './flow';
import { TILES } from './config';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { HudPlate, allowBlurFor, allowBurstFor, useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import { NeonFlashWorld } from './NeonFlashWorld';
import { NeonFlashHud } from './NeonFlashHud';
import { NeonCabinet, NeonPad } from './NeonPad';
import { FlashTone } from './neonTokens';

const GRID_GAP = 12;
const HOW_TO_TITLE = 'Neon Flash';
const HOW_TO_BODY = 'Watch the pattern and repeat the same order.';

export default function SimonSaysScreen({
  difficulty,
  skipHowTo,
  onHowToFinished,
  onCorrect,
  onComplete,
  onExitToCategory,
  onRestart,
}: SevenGameScreenProps) {
  const [playing, setPlaying] = useState(false);
  const [wrongOpen, setWrongOpen] = useState(false);
  const { round, maxRounds, activeTile, isShowingSeq, submitChoice, retryRound } = useSimonFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const quality = useVisualQuality();
  const { width: screenW } = useWindowDimensions();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 10;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 14;
  const cabinetSize = Math.min(screenW - 36, 352);
  const inner = cabinetSize - 30;
  const tileSize = (inner - GRID_GAP) / 2;
  const roundRatio = maxRounds > 0 ? Math.min(1, round / maxRounds) : 0;
  const burst = allowBurstFor(quality);
  const activeLight = useMemo(
    () => TILES.find((tile) => tile.id === activeTile)?.light ?? null,
    [activeTile],
  );

  return (
    <SevenGameSessionShell
      howToTitle={HOW_TO_TITLE}
      howToBody={HOW_TO_BODY}
      skipHowTo={skipHowTo}
      wrongOpen={wrongOpen}
      onHowToFinished={onHowToFinished}
      onPlayStart={() => setPlaying(true)}
      onContinue={() => {
        retryRound();
        setWrongOpen(false);
      }}
      onExitToCategory={onExitToCategory}
      onRestart={onRestart}
    >
      <NeonFlashWorld quality={quality} watching={isShowingSeq} activeLight={activeLight}>
        <View style={[styles.play, { paddingTop: topPad, paddingBottom: botPad }]}>
          <NeonFlashHud
            round={round}
            maxRounds={maxRounds}
            watching={isShowingSeq}
            roundRatio={roundRatio}
            rowStyle={{ flexDirection }}
            glow={allowBlurFor(quality)}
          />

          <HudPlate
            blur={allowBlurFor(quality)}
            border={isShowingSeq ? 'rgba(255,224,138,0.42)' : 'rgba(94,242,194,0.38)'}
            fill={['rgba(18,8,42,0.88)', 'rgba(8,4,22,0.78)']}
            style={styles.hintPlate}
          >
            <Text
              style={[
                styles.hint,
                { color: isShowingSeq ? FlashTone.watch : FlashTone.play },
              ]}
            >
              {isShowingSeq ? 'Watch the pattern...' : 'Now you repeat!'}
            </Text>
          </HudPlate>

          <View style={styles.stage}>
            <NeonCabinet size={cabinetSize} watching={isShowingSeq}>
              <View style={[styles.simonGrid, { width: inner, height: inner }]}>
                {TILES.map((tile) => (
                  <NeonPad
                    key={tile.id}
                    color={tile.color}
                    light={tile.light}
                    lit={activeTile === tile.id}
                    size={tileSize}
                    burst={burst}
                    armed={!isShowingSeq}
                    onPress={() => submitChoice(tile.id)}
                  />
                ))}
              </View>
            </NeonCabinet>
          </View>
        </View>
      </NeonFlashWorld>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  play: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  hintPlate: {
    alignSelf: 'stretch',
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  stage: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
});
