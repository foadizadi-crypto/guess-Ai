import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameColors } from '@/theme/colors';
import { layoutStyles, usePopupChromeSize } from '@/theme/webLayout';
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
  atmosphere = 'default',
}: SevenGameSessionShellProps) {
  const [phase, setPhase] = useState<Phase>(skipHowTo ? 'countdown' : 'howTo');
  const [countLabel, setCountLabel] = useState<string>(COUNT_STEPS[0]);
  const playStarted = useRef(false);
  const onPlayStartRef = useRef(onPlayStart);
  onPlayStartRef.current = onPlayStart;
  const treasure = atmosphere === 'treasure';

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
  const popupH = usePopupChromeSize();

  const howToCard = (
    <View style={[layoutStyles.popupCard, treasure && styles.treasurePopup, { height: popupH }]}>
      <Text style={[layoutStyles.popupTitle, treasure && styles.treasureTitle]}>{howToTitle}</Text>
      <ScrollView
        style={layoutStyles.popupScroller}
        contentContainerStyle={layoutStyles.popupScrollContent}
        showsVerticalScrollIndicator
      >
        <Text style={[layoutStyles.popupBody, treasure && styles.treasureBody]}>{howToBody}</Text>
      </ScrollView>
      <TouchableOpacity
        style={[styles.readyBtn, treasure && styles.treasureReady]}
        onPress={handleReady}
        activeOpacity={0.85}
      >
        <Text style={[styles.readyText, treasure && styles.treasureReadyText]}>I'M READY</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.playArea} pointerEvents={playing ? 'auto' : 'none'}>
        {children}
      </View>

      {phase === 'howTo' ? (
        treasure ? (
          <LinearGradient colors={['rgba(7,4,13,0.92)', 'rgba(20,10,8,0.88)']} style={layoutStyles.popupCover}>
            {howToCard}
          </LinearGradient>
        ) : (
          <View style={layoutStyles.popupCover}>{howToCard}</View>
        )
      ) : null}

      {phase === 'countdown' ? (
        treasure ? (
          <LinearGradient colors={['rgba(7,4,13,0.9)', 'rgba(20,10,8,0.86)']} style={styles.countCover}>
            <Text style={[styles.countText, treasure && styles.treasureCount]}>{countLabel}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.countCover}>
            <Text style={styles.countText}>{countLabel}</Text>
          </View>
        )
      ) : null}

      <Modal visible={wrongOpen} transparent animationType="fade" onRequestClose={onExitToCategory}>
        <View style={layoutStyles.popupBackdrop}>
          <View style={[layoutStyles.popupCard, treasure && styles.treasurePopup, { height: popupH }]}>
            <Text style={[layoutStyles.popupTitle, treasure && styles.treasureTitle]}>Wrong</Text>
            <ScrollView style={layoutStyles.popupScroller} contentContainerStyle={layoutStyles.popupScrollContent}>
              <View style={styles.wrongActions}>
                <TouchableOpacity style={[styles.popupBtn, treasure && styles.treasurePopupBtn]} onPress={handleContinue} activeOpacity={0.85}>
                  <Text style={styles.popupBtnText}>DEV / NO-AD CONTINUE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.popupBtn, treasure && styles.treasurePopupBtn]} onPress={onRestart} activeOpacity={0.85}>
                  <Text style={styles.popupBtnText}>RESTART</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.popupBtn, styles.exitBtn]} onPress={onExitToCategory} activeOpacity={0.85}>
                  <Text style={styles.popupBtnText}>EXIT TO CATEGORY</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GameColors.backgroundPrimary },
  playArea: { flex: 1 },
  countCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GameColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  readyBtn: {
    backgroundColor: GameColors.accentGold,
    minWidth: 240,
    maxWidth: '100%',
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 16,
    flexShrink: 0,
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
  wrongActions: {
    width: '100%',
    gap: 12,
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
  treasureTitle: { color: '#F4D78A' },
  treasureBody: { color: 'rgba(247,241,227,0.78)' },
  treasureReady: {
    backgroundColor: '#F4D78A',
    borderWidth: 1,
    borderColor: 'rgba(201,162,74,0.7)',
  },
  treasureReadyText: { color: '#1A1004' },
  treasureCount: { color: '#F4D78A' },
  treasurePopup: {
    backgroundColor: '#14081F',
    borderColor: 'rgba(201,162,74,0.4)',
  },
  treasurePopupBtn: {
    backgroundColor: 'rgba(18,10,28,0.9)',
    borderColor: 'rgba(244,215,138,0.22)',
  },
});
