import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useMatchFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';

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

  return (
    <SevenGameSessionShell
      howToTitle="Twin Link"
      howToBody="کارت‌های جفت را پیدا کن."
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
      <View style={styles.container}>
        <Text style={styles.scoreText}>جفت: {pairsFound} از {maxRounds} | حرکت‌ها: {moves}</Text>
        <View style={styles.matchGrid}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.7}
              onPress={() => flipCard(index)}
              style={[styles.matchCard, { backgroundColor: card.isFlipped || card.isMatched ? '#fff' : '#2c3e50' }]}
            >
              {(card.isFlipped || card.isMatched) && <Text style={styles.iconText}>{card.icon}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  scoreText: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 20 },
  matchGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 },
  matchCard: { width: 70, height: 70, margin: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  iconText: { fontSize: 24 },
});
