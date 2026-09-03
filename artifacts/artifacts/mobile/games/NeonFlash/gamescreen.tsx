import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSimonFlow } from './flow';
import { TILES } from './config';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';

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

  return (
    <SevenGameSessionShell
      howToTitle="Neon Flash"
      howToBody="الگو را ببین و همان ترتیب را تکرار کن."
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
        <Text style={styles.scoreText}>مرحله: {round} از {maxRounds}</Text>
        <Text style={styles.instruction}>{isShowingSeq ? 'به الگو دقت کن...' : 'حالا تو تکرار کن!'}</Text>
        <View style={styles.simonGrid}>
          {TILES.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              activeOpacity={0.6}
              onPress={() => submitChoice(tile.id)}
              style={[styles.simonTile, { backgroundColor: activeTile === tile.id ? tile.light : tile.color }]}
            />
          ))}
        </View>
      </View>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  instruction: { fontSize: 16, color: '#bdc3c7', marginBottom: 30 },
  simonGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center' },
  simonTile: { width: 110, height: 110, margin: 10, borderRadius: 15 },
});
