import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useDifferenceFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';

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

  return (
    <SevenGameSessionShell
      howToTitle="Glitch Spy"
      howToBody="شکلی که با بقیه فرق دارد را پیدا کن."
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
        {!gridData ? null : (
          <>
            <Text style={styles.scoreText}>مرحله: {round} از {maxRounds} | امتیاز: {score}</Text>
            <Text style={styles.timerText}>زمان باقی‌مانده: {timeLeft.toFixed(1)}s</Text>
            <Text style={styles.instruction}>به جدول پایین نگاه کن و شکلی که با بقیه تفاوت داره رو لمس کن!</Text>
            <View style={styles.gridContainer}>
              <Text style={styles.gridLabel}>تصویر مرجع 👁️</Text>
              <View style={styles.grid}>
                {gridData.items.map((item, idx) => (
                  <View
                    key={`ref-${idx}`}
                    style={[styles.tile, { width: 240 / numColumns, height: 240 / numColumns, backgroundColor: '#2c3e50' }]}
                  >
                    <Text style={{ fontSize: 96 / numColumns }}>
                      {idx === gridData.differentIndex ? gridData.items[(idx + 1) % gridCount] : item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.gridContainer}>
              <Text style={styles.gridLabel}>تصویر دوم (یک اختلاف پیدا کن!) 👇</Text>
              <View style={styles.grid}>
                {gridData.items.map((item, idx) => (
                  <TouchableOpacity
                    key={`target-${idx}`}
                    activeOpacity={0.7}
                    onPress={() => selectTile(idx)}
                    style={[styles.tile, { width: 240 / numColumns, height: 240 / numColumns, backgroundColor: '#34495e' }]}
                  >
                    <Text style={{ fontSize: 96 / numColumns }}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 15 },
  scoreText: { fontSize: 16, color: '#fff', fontWeight: 'bold', marginBottom: 5 },
  timerText: { fontSize: 16, color: '#e74c3c', fontWeight: 'bold', marginBottom: 10 },
  instruction: { fontSize: 13, color: '#bdc3c7', marginBottom: 15, textAlign: 'center', paddingHorizontal: 10 },
  gridContainer: { alignItems: 'center', marginVertical: 5 },
  gridLabel: { color: '#aaa', fontSize: 12, marginBottom: 5, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 250, justifyContent: 'center', backgroundColor: '#0f0f1b', padding: 5, borderRadius: 10 },
  tile: { margin: 2, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  divider: { width: '80%', height: 2, backgroundColor: '#444', marginVertical: 10 },
});
