import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDifferenceFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { HudPlate, allowBlurFor, useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import { GlitchSpyWorld } from './GlitchSpyWorld';
import { GlitchSpyHud } from './GlitchSpyHud';
import { SPY_FRAME_PAD, SPY_TILE_GAP, SpyMatrix, SpySync } from './SpyMatrix';
import { SpyTone } from './glitchTokens';

const HOW_TO_TITLE = 'Glitch Spy';
const HOW_TO_BODY =
  'Two grids. The top is the clean reference. Tap the one shape on the bottom grid that does not match.';

export default function SpotDifferenceScreen({
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
  const { gridData, round, maxRounds, timeLeft, score, gridCount, selectTile, retryRound } = useDifferenceFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );
  const numColumns = Math.sqrt(gridCount);

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const quality = useVisualQuality();
  const { width, height } = useWindowDimensions();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 10;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 14;

  const boardKey = gridData
    ? `${round}:${gridCount}:${gridData.items.join('')}:${gridData.differentIndex}`
    : `empty:${round}`;

  const [capKey, setCapKey] = useState(boardKey);
  const [roundCap, setRoundCap] = useState(() => Math.max(timeLeft, 0.1));
  if (capKey !== boardKey) {
    setCapKey(boardKey);
    setRoundCap(Math.max(timeLeft, 0.1));
  }

  const timerRatio = Math.min(1, Math.max(0, timeLeft / roundCap));
  const hudBlock = 158;
  const hintBlock = 52;
  const syncBlock = 22;
  const available = height - topPad - botPad - hudBlock - hintBlock - syncBlock;
  const boardSize = Math.max(
    168,
    Math.min(width - 40, 300, Math.floor(available / 2) - 8),
  );
  const innerSize = boardSize - SPY_FRAME_PAD * 2 - 10;
  const tileSize = numColumns > 0 ? Math.floor((innerSize - SPY_TILE_GAP * (numColumns - 1)) / numColumns) : 0;
  const glyphSize = numColumns > 0 ? Math.max(14, 92 / numColumns) : 16;

  const boardScale = useSharedValue(1);

  useEffect(() => {
    boardScale.value = 0.96;
    boardScale.value = withSpring(1, { damping: 14, stiffness: 220 });
  }, [boardKey, boardScale]);

  const boardsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));

  const referenceGlyphs = useMemo(() => {
    if (!gridData) return [];
    return gridData.items.map((item, idx) =>
      idx === gridData.differentIndex ? gridData.items[(idx + 1) % gridCount] : item,
    );
  }, [gridData, gridCount]);

  const liveGlyphs = gridData?.items ?? [];
  const urgency = playing && !wrongOpen && timeLeft <= 1;

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
      <GlitchSpyWorld quality={quality} urgency={urgency}>
        <View style={[styles.play, { paddingTop: topPad, paddingBottom: botPad }]}>
          <GlitchSpyHud
            round={round}
            maxRounds={maxRounds}
            score={score}
            timeLeft={timeLeft}
            timeRatio={timerRatio}
            rowStyle={{ flexDirection }}
            glow={allowBlurFor(quality)}
          />

          <HudPlate
            blur={allowBlurFor(quality)}
            border="rgba(52,245,197,0.34)"
            fill={['rgba(8,22,28,0.88)', 'rgba(3,8,12,0.78)']}
            style={styles.hintPlate}
          >
            <Text style={styles.hint}>Compare both grids. Tap the cell that does not match.</Text>
          </HudPlate>

          {!gridData ? null : (
            <Animated.View style={[styles.boards, boardsStyle]}>
              <SpyMatrix
                label="Reference"
                glyphs={referenceGlyphs}
                width={boardSize}
                tileSize={tileSize}
                fontSize={glyphSize}
                interactive={false}
              />
              <SpySync />
              <SpyMatrix
                label="Live feed"
                glyphs={liveGlyphs}
                width={boardSize}
                tileSize={tileSize}
                fontSize={glyphSize}
                interactive
                onPressTile={selectTile}
              />
            </Animated.View>
          )}
        </View>
      </GlitchSpyWorld>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  play: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 10,
  },
  hintPlate: {
    alignSelf: 'stretch',
  },
  hint: {
    color: SpyTone.ink,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
  },
  boards: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
});
