import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { usePerfectClickFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';

export default function PerfectClickScreen({
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
  const {
    elapsedTime,
    isRunning,
    isFinished,
    roundScore,
    targetTime,
    hideTime,
    round,
    maxRounds,
    score,
    startTimer,
    stopTimer,
    retryRound,
  } = usePerfectClickFlow(
    difficulty,
    playing,
    wrongOpen,
    onCorrect,
    () => setWrongOpen(true),
    onComplete,
  );
  const shouldHideTimer = isRunning && elapsedTime > hideTime;

  return (
    <SevenGameSessionShell
      howToTitle="Tick Lock"
      howToBody="تایمر را روی زمان هدف متوقف کن."
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
        <Text style={styles.headerText}>راند: {round} از {maxRounds} | امتیاز: {score}</Text>
        <Text style={styles.instruction}>
          هدف: زمان را روی ثانیه <Text style={styles.targetHighlight}>{targetTime.toFixed(2)}</Text> متوقف کن!
        </Text>
        <View style={styles.timerDisplayBox}>
          {shouldHideTimer ? (
            <Text style={styles.hiddenTimerText}>🙈 زمان مخفی شد! تمرکز کن...</Text>
          ) : (
            <Text style={styles.timerText}>{elapsedTime.toFixed(2)}s</Text>
          )}
        </View>
        {!isRunning && !isFinished ? (
          <TouchableOpacity style={[styles.mainBtn, styles.startBtn]} onPress={startTimer}>
            <Text style={styles.btnText}>شروع 🚀</Text>
          </TouchableOpacity>
        ) : isRunning ? (
          <TouchableOpacity style={[styles.mainBtn, styles.stopBtn]} onPress={stopTimer}>
            <Text style={styles.btnText}>ایست! 🛑</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>امتیاز: {roundScore}</Text>
          </View>
        )}
      </View>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerText: { fontSize: 16, color: '#bdc3c7', marginBottom: 16 },
  instruction: { fontSize: 16, color: '#bdc3c7', textAlign: 'center', marginBottom: 40 },
  targetHighlight: { color: '#f1c40f', fontSize: 20, fontWeight: 'bold' },
  timerDisplayBox: { height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
  timerText: { fontSize: 64, fontWeight: 'bold', color: '#fff' },
  hiddenTimerText: { fontSize: 18, color: '#e74c3c', fontWeight: 'bold' },
  mainBtn: { width: 180, height: 180, borderRadius: 90, justifyContent: 'center', alignItems: 'center' },
  startBtn: { backgroundColor: '#2ecc71' },
  stopBtn: { backgroundColor: '#e74c3c' },
  btnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  resultBox: { alignItems: 'center' },
  resultText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
});
