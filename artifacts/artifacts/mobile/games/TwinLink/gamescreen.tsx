import React, { useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import { TwinWorld } from './TwinWorld';
import { TwinHud } from './TwinHud';
import { MemoryTile } from './MemoryTile';

const SCREEN_W = Dimensions.get('window').width;

export default function MemoryMatchScreen({
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
  const { cards, moves, pairsFound, maxRounds, flipCard, retryRound } = useMatchFlow(
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
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 12;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 16;
  const cardCount = cards.length;
  const compact = cardCount > 12;
  const cardSize = cardCount > 16 ? 54 : cardCount > 12 ? 62 : 72;
  const pairRatio = maxRounds > 0 ? Math.min(1, pairsFound / maxRounds) : 0;

  return (
    <SevenGameSessionShell
      howToTitle="Twin Link"
      howToBody="Find the matching pairs."
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
      <TwinWorld quality={quality} pairRatio={pairRatio} mismatch={wrongOpen}>
        <View style={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}>
          <TwinHud
            pairsFound={pairsFound}
            maxRounds={maxRounds}
            moves={moves}
            pairRatio={pairRatio}
            rowStyle={{ flexDirection }}
            compact={compact}
          />

          <View style={styles.tableWrap}>
            <View pointerEvents="none" style={styles.tablePad} />
            <View style={[styles.matchGrid, { maxWidth: Math.min(SCREEN_W - 40, 360) }]}>
              {cards.map((card, index) => (
                <MemoryTile
                  key={card.id}
                  icon={card.icon}
                  revealed={card.isFlipped || card.isMatched}
                  matched={card.isMatched}
                  size={cardSize}
                  index={index}
                  onPress={() => flipCard(index)}
                />
              ))}
            </View>
          </View>
        </View>
      </TwinWorld>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 14,
  },
  tableWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
  },
  tablePad: {
    position: 'absolute',
    width: '92%',
    height: '78%',
    borderRadius: 160,
    backgroundColor: 'rgba(18,10,40,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(233,213,255,0.16)',
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
});
