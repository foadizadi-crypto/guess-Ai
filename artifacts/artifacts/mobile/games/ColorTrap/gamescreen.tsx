import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useStroopFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';

export default function StroopGameScreen({
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
  const { currentQuestion, score, maxQuestions, round, timeLeft, submitAnswer, retryRound } = useStroopFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );

  return (
    <SevenGameSessionShell
      howToTitle="Color Trap"
      howToBody="رنگِ متن را انتخاب کن، نه خودِ کلمه را."
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
        {!currentQuestion ? null : (
          <>
            <Text style={styles.scoreText}>راند: {round} از {maxQuestions} | امتیاز: {score}</Text>
            <Text style={styles.timerText}>زمان: {timeLeft.toFixed(1)}s</Text>
            <Text style={styles.instruction}>رنگِ متن را انتخاب کن (نه خود کلمه را!)</Text>
            <View style={styles.wordBox}>
              <Text style={[styles.mainWord, { color: currentQuestion.textColor.hex }]}>{currentQuestion.word.name}</Text>
            </View>
            <View style={styles.optionsGrid}>
              {currentQuestion.options.map((opt, i) => (
                <TouchableOpacity key={i} style={styles.btnOption} onPress={() => submitAnswer(opt)}>
                  <Text style={styles.btnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  scoreText: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  timerText: { fontSize: 18, color: '#e74c3c', fontWeight: 'bold', marginBottom: 20 },
  instruction: { fontSize: 16, color: '#bdc3c7', marginBottom: 30 },
  wordBox: { height: 120, justifyContent: 'center', marginBottom: 40 },
  mainWord: { fontSize: 48, fontWeight: 'bold' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 },
  btnOption: { backgroundColor: '#16a085', width: 130, padding: 15, margin: 10, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
