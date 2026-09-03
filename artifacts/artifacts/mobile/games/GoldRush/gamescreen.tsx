import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFateFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';
import { allowBlurFor, allowBurstFor, useVisualQuality } from '@/games/visualFoundation';
import { useRTL } from '@/hooks/useRTL';
import { GoldRushWorld } from './GoldRushWorld';
import { TreasureCard } from './TreasureCard';
import { StakesHud } from './StakesHud';
import { BankVaultButton } from './BankVaultButton';

export default function FateGameScreen({
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
  const { deck, currentPot, savedScore, round, maxRounds, selectCard, bankScore, retryRound } = useFateFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );

  const insets = useSafeAreaInsets();
  const { flexDirection } = useRTL();
  const { width } = useWindowDimensions();
  const quality = useVisualQuality();
  const topPad = Platform.OS === 'web' ? 54 : insets.top + 10;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 14;
  const threat = deck.some((card) => card.isRevealed && card.type === 'bomb');

  const { cardW, cardH } = useMemo(() => {
    const columns = 3;
    const gutter = 12;
    const side = 40;
    const w = Math.min(118, Math.floor((width - side - gutter * (columns - 1)) / columns));
    return { cardW: Math.max(88, w), cardH: Math.round(Math.max(88, w) * 1.38) };
  }, [width]);

  return (
    <SevenGameSessionShell
      howToTitle="Gold Rush"
      howToBody="Flip the cards, collect gold, and bank your score before the bomb."
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
      atmosphere="treasure"
    >
      <GoldRushWorld quality={quality} threat={threat}>
        <View style={[styles.play, { paddingTop: topPad, paddingBottom: botPad }]}>
          <StakesHud
            round={round}
            maxRounds={maxRounds}
            savedScore={savedScore}
            currentPot={currentPot}
            rowStyle={{ flexDirection }}
            blur={allowBlurFor(quality)}
          />

          <View style={styles.table}>
            {deck.length === 0 ? (
              <View style={styles.sealing} />
            ) : (
              deck.map((card, idx) => (
                <TreasureCard
                  key={card.id}
                  card={card}
                  width={cardW}
                  height={cardH}
                  index={idx}
                  burst={allowBurstFor(quality) && card.isRevealed}
                  onPress={() => selectCard(idx)}
                />
              ))
            )}
          </View>

          <View style={styles.bankSlot}>
            {currentPot > 0 ? <BankVaultButton onPress={bankScore} /> : <View style={styles.bankSpacer} />}
          </View>
        </View>
      </GoldRushWorld>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  play: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  table: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 12,
  },
  bankSlot: {
    minHeight: 58,
    justifyContent: 'flex-end',
  },
  bankSpacer: { height: 58 },
  sealing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201,162,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,215,138,0.22)',
  },
});
