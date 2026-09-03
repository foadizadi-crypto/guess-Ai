import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useReactionFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';

export default function ReverseReactionScreen({
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
  const { currentCircle, round, maxRounds, timeLeft, score, handleButtonPress, retryRound } = useReactionFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );

  return (
    <SevenGameSessionShell
      howToTitle="Flip Mind"
      howToBody="رنگ دایره را ببین و دکمه رنگ مخالف را فشار بده."
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
        <View style={styles.topInfo}>
          <Text style={styles.headerText}>مرحله: {round} از {maxRounds}</Text>
          <Text style={styles.scoreText}>امتیاز: {score}</Text>
        </View>
        <Text style={styles.instruction}>❌ برعکس عمل کن! اگه دایره سبزه، دکمه قرمز رو بزن!</Text>
        <View style={styles.centerArea}>
          <View style={[styles.targetCircle, { backgroundColor: currentCircle === 'green' ? '#2ecc71' : '#e74c3c' }]} />
          <Text style={styles.timerText}>{timeLeft.toFixed(2)}s</Text>
        </View>
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
            activeOpacity={0.7}
            onPress={() => handleButtonPress('green')}
          >
            <Text style={styles.btnText}>سبز</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
            activeOpacity={0.7}
            onPress={() => handleButtonPress('red')}
          >
            <Text style={styles.btnText}>قرمز</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#141423', justifyContent: 'space-between', paddingVertical: 40, paddingHorizontal: 20 },
  topInfo: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  headerText: { fontSize: 16, color: '#bdc3c7' },
  scoreText: { fontSize: 18, color: '#2ecc71', fontWeight: 'bold' },
  instruction: { fontSize: 15, color: '#f1c40f', fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  targetCircle: { width: 140, height: 140, borderRadius: 70, marginBottom: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  timerText: { fontSize: 32, fontWeight: 'bold', color: '#fff', fontVariant: ['tabular-nums'] },
  bottomButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, paddingHorizontal: 10 },
  actionButton: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 4 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
