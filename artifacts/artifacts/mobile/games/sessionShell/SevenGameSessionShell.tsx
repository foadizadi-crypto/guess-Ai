import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameColors } from '@/theme/colors';
import { requestContinueReward } from './requestContinueReward';
import type { SevenGameSessionShellProps } from './types';

type Phase = 'howTo' | 'countdown' | 'play';

const COUNT_STEPS = ['3', '2', '1', 'GO!'] as const;

export default function SevenGameSessionShell({
  howToTitle,
  howToBody,
  skipHowTo = false,
  wrongOpen,
  children,
  onHowToFinished,
  onPlayStart,
  onContinue,
  onExitToCategory,
  onRestart,
}: SevenGameSessionShellProps) {
  const [phase, setPhase] = useState<Phase>(skipHowTo ? 'countdown' : 'howTo');
  const [countLabel, setCountLabel] = useState<string>(COUNT_STEPS[0]);
  const playStarted = useRef(false);
  const onPlayStartRef = useRef(onPlayStart);
  onPlayStartRef.current = onPlayStart;

  useEffect(() => {
    if (phase !== 'countdown') return;
    playStarted.current = false;
    let i = 0;
    setCountLabel(COUNT_STEPS[0]);
    const id = setInterval(() => {
      i += 1;
      if (i >= COUNT_STEPS.length) {
        clearInterval(id);
        setPhase('play');
        if (!playStarted.current) {
          playStarted.current = true;
          onPlayStartRef.current();
        }
        return;
      }
      setCountLabel(COUNT_STEPS[i]);
    }, 700);
    return () => clearInterval(id);
  }, [phase]);

  const handleReady = () => {
    onHowToFinished?.();
    setPhase('countdown');
  };

  const handleContinue = async () => {
    const ok = await requestContinueReward();
    if (ok) onContinue();
  };

  const playing = phase === 'play' && !wrongOpen;

  return (
    <View style={styles.root}>
      <View style={styles.playArea} pointerEvents={playing ? 'auto' : 'none'}>
        {children}
      </View>

      {phase === 'howTo' ? (
        <View style={styles.cover}>
          <Text style={styles.howToTitle}>{howToTitle}</Text>
          <Text style={styles.howToBody}>{howToBody}</Text>
          <TouchableOpacity style={styles.readyBtn} onPress={handleReady} activeOpacity={0.85}>
            <Text style={styles.readyText}>I'M READY</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {phase === 'countdown' ? (
        <View style={styles.cover}>
          <Text style={styles.countText}>{countLabel}</Text>
        </View>
      ) : null}

      <Modal visible={wrongOpen} transparent animationType="fade" onRequestClose={onExitToCategory}>
        <View style={styles.modalBackdrop}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>Wrong</Text>
            <TouchableOpacity style={styles.popupBtn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.popupBtnText}>DEV / NO-AD CONTINUE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupBtn} onPress={onRestart} activeOpacity={0.85}>
              <Text style={styles.popupBtnText}>RESTART</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.popupBtn, styles.exitBtn]} onPress={onExitToCategory} activeOpacity={0.85}>
              <Text style={styles.popupBtnText}>EXIT TO CATEGORY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GameColors.backgroundPrimary },
  playArea: { flex: 1 },
  cover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GameColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  howToTitle: {
    color: GameColors.textWhite,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  howToBody: {
    color: GameColors.textSecondary,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 36,
  },
  readyBtn: {
    backgroundColor: GameColors.accentGold,
    minWidth: 240,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  readyText: {
    color: GameColors.backgroundPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  countText: {
    color: GameColors.accentGold,
    fontSize: 72,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: GameColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popup: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: GameColors.card,
    borderRadius: 20,
    padding: 22,
    gap: 12,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  popupTitle: {
    color: GameColors.textWhite,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  popupBtn: {
    backgroundColor: GameColors.backgroundSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  exitBtn: { borderColor: GameColors.accentRed },
  popupBtnText: {
    color: GameColors.textWhite,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
