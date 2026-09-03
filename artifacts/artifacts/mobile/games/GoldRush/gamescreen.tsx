import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useFateFlow } from './flow';
import { SevenGameSessionShell } from '@/games/sessionShell';
import type { SevenGameScreenProps } from '@/games/sessionShell';

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

  return (
    <SevenGameSessionShell
      howToTitle="Gold Rush"
      howToBody="کارت‌ها را باز کن، طلا جمع کن، و قبل از بمب امتیاز را ذخیره کن."
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
        <Text style={styles.headerText}>راند: {round} از {maxRounds}</Text>
        <Text style={styles.savedScoreText}>امتیاز بانکی (قطعی): {savedScore}</Text>
        <View style={styles.potContainer}>
          <Text style={styles.potText}>امتیاز ریسک این راند: {currentPot}</Text>
          <Text style={styles.warningText}>اگه به بمب بخوری، این امتیاز می‌سوزه!</Text>
        </View>
        <View style={styles.cardGrid}>
          {deck.map((card, idx) => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.7}
              onPress={() => selectCard(idx)}
              style={[
                styles.card,
                { backgroundColor: card.isRevealed ? (card.type === 'bomb' ? '#e74c3c' : '#f1c40f') : '#2c3e50' },
              ]}
            >
              {card.isRevealed ? (
                <Text style={styles.cardContent}>
                  {card.type === 'bomb' ? '💣' : card.type === 'multiplier' ? 'X2' : `+${card.value}`}
                </Text>
              ) : (
                <Text style={styles.cardBack}>?</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {currentPot > 0 && (
          <TouchableOpacity style={styles.btnBank} onPress={bankScore}>
            <Text style={styles.btnText}>💰 ذخیره امتیاز و رفتن به راند بعد</Text>
          </TouchableOpacity>
        )}
      </View>
    </SevenGameSessionShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerText: { fontSize: 18, color: '#bdc3c7', marginBottom: 5 },
  savedScoreText: { fontSize: 22, color: '#2ecc71', fontWeight: 'bold', marginBottom: 20 },
  potContainer: { backgroundColor: '#16a085', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30, width: '90%' },
  potText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  warningText: { fontSize: 12, color: '#fff', opacity: 0.8, marginTop: 5 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 },
  card: { width: 80, height: 110, margin: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  cardBack: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  cardContent: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  btnBank: { marginTop: 30, backgroundColor: '#2ecc71', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
