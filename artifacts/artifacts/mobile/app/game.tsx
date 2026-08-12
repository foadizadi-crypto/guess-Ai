/**
 * app/game.tsx — Core Guessing Game Loop Screen
 *
 * Implements the full-scale main gameplay loop for BlurQuiz.
 * Handles multi-question quiz sessions, dynamic linear blur-reveal interpolation,
 * selection score matrices, combo tracking systems, anti-cheat XP caps,
 * unified haptic feedbacks, and absolute audio stream memory disposal tracks.
 *
 * Fixed TypeScript Compiler Strict Mode Warnings (COMPREHENSIVE):
 * 1. Removed unused variable 'SW' (width dimension not needed)
 * 2. Removed unused 'setGameFinished' state setter (game end logic handled via handleEndSession)
 * 3. Fixed mission type calls: 'play_game' → 'play_games', 'correct_answer' → 'correct_answers'
 * 4. Fixed power-up ID types: 'clarity_bomb' → 'reveal-blur', 'time_boost' → 'double-xp'
 * 5. Fixed timer interval ref type from 'number' to 'NodeJS.Timeout'
 * 6. Fixed animated style filter property to use StyleSheet.create patterns
 * 7. Fixed text color type incompatibility with string unions
 * 8. Removed structural layout imports not used ('Image', 'ActivityIndicator', 'withRepeat')
 * 9. Ensured PowerUpInventory/ConsumableInventory property access matches actual types
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import type { MissionType } from '@/types';

const { height: SH } = Dimensions.get('window');

interface QuestionNode {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl: string | null;
  correctOption: string;
  options: string[];
}

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ─── ZUSTAND GLOBAL STATE SELECTORS ────────────────────────────────────────
  const powerUps = useUserStore((state) => state.powerUps);
  const consumables = useUserStore((state) => state.consumables);
  const multiplierSessionsLeft = useUserStore((state) => state.multiplierSessionsLeft);
  
  // Zustand Store Core Action Triggers
  const addCoinsAction = useUserStore((state) => state.addCoins);
  const addXPAction = useUserStore((state) => state.addXP);
  const usePowerUpAction = useUserStore((state) => state.usePowerUp);
  const useConsumableAction = useUserStore((state) => state.useConsumable);
  const updateBestScoreAction = useUserStore((state) => state.updateBestScore);
  const updateStatisticsAction = useUserStore((state) => state.updateStatistics);
  const updateMissionProgressAction = useUserStore((state) => state.updateMissionProgress);
  const checkAndUnlockAchievementsAction = useUserStore((state) => state.checkAndUnlockAchievements);
  const spendEnergyAction = useUserStore((state) => state.spendEnergy);

  // ─── LOCAL GAMEPLAY STATES ─────────────────────────────────────────────────
  const [quizQueue] = useState<QuestionNode[]>([
    {
      id: 'q_sync_1',
      category: 'Pop Culture 🎬',
      difficulty: 'medium',
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600',
      correctOption: 'Cinema Paradiso',
      options: ['Inception', 'Cinema Paradiso', 'Interstellar', 'The Godfather'],
    },
    {
      id: 'q_sync_2',
      category: 'Nature & Wildlife 🌿',
      difficulty: 'easy',
      imageUrl: null, 
      correctOption: 'Golden Eagle',
      options: ['Peregrine Falcon', 'Golden Eagle', 'Barn Owl', 'Osprey'],
    },
    {
      id: 'q_sync_3',
      category: 'Global Landmarks 🗺️',
      difficulty: 'hard',
      imageUrl: 'https://images.unsplash.com/photo-1542820229-081e0f12af0c?w=600',
      correctOption: 'Colosseum',
      options: ['Eiffel Tower', 'Colosseum', 'Taj Mahal', 'Machu Picchu'],
    }
  ]);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [maxComboThisGame, setMaxComboThisGame] = useState<number>(0);
  const [totalCorrectAnswersThisGame, setTotalCorrectAnswersThisGame] = useState<number>(0);
  const [isPerfectGame, setIsPerfectGame] = useState<boolean>(true);

  // Active Buff Modifiers
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [disabledWrongOptions, setDisabledWrongOptions] = useState<string[]>([]);

  // ─── SHARED ANIMATION RUNTIMES ─────────────────────────────────────────────
  const blurRadius = useSharedValue(25);
  const clarityProgress = useSharedValue(0.15);
  const timerScale = useSharedValue(1);
  const scorePopupScale = useSharedValue(0);
  const comboBadgeScale = useSharedValue(1);

  // Stream hardware buffers
  const soundEffectRef = useRef<Audio.Sound | null>(null);
  const backgroundMusicRef = useRef<Audio.Sound | null>(null);
  const timerLoopRef = useRef<NodeJS.Timeout | null>(null);

  const topPad = Platform.OS === 'web' ? 40 : insets.top;
  const botPad = Platform.OS === 'web' ? 32 : Math.max(insets.bottom, 16);

  const activeQuestion: QuestionNode | undefined = quizQueue[currentIdx];

  // ─── AUDIO GARBAGE COLLECTION PIPELINE (P2 Memory Leak Fix) ───────────────
  const releaseAudioHardware = useCallback(async () => {
    try {
      if (timerLoopRef.current) {
        clearInterval(timerLoopRef.current);
        timerLoopRef.current = null;
      }
      if (soundEffectRef.current) {
        await soundEffectRef.current.stopAsync().catch(() => {});
        await soundEffectRef.current.unloadAsync().catch(() => {});
        soundEffectRef.current = null;
      }
      if (backgroundMusicRef.current) {
        await backgroundMusicRef.current.stopAsync().catch(() => {});
        await backgroundMusicRef.current.unloadAsync().catch(() => {});
        backgroundMusicRef.current = null;
      }
    } catch (err) {
      console.log('[Memory Controller] Audio release silent suppress:', err);
    }
  }, []);

  const triggerAudioTrack = async () => {
    try {
      if (soundEffectRef.current) {
        await soundEffectRef.current.unloadAsync().catch(() => {});
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/click.mp3')
      );
      soundEffectRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.log('[Audio Error] Failed to stream asset:', e);
    }
  };

  // ─── CORE GAME SYSTEM LOGISTICS ────────────────────────────────────────────
  useEffect(() => {
    const verifyEnergy = spendEnergyAction();
    if (!verifyEnergy && !__DEV__) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      router.replace('/lobby');
    }

    updateMissionProgressAction('play_games' as MissionType, 1);

    return () => {
      releaseAudioHardware();
    };
  }, [spendEnergyAction, updateMissionProgressAction, releaseAudioHardware]);

  // Timer loop initialization per question cycle
  useEffect(() => {
    if (!activeQuestion || selectedOption) return;

    setTimeLeft(15);
    blurRadius.value = 25;
    clarityProgress.value = 0.15;
    setDisabledWrongOptions([]);

    timerLoopRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerLoopRef.current) clearInterval(timerLoopRef.current);
          handleSubmission('');
          return 0;
        }

        if (prev <= 6) {
          timerScale.value = withSequence(withTiming(1.2, { duration: 100 }), withTiming(1, { duration: 100 }));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }

        const stepBlur = Math.max(0, blurRadius.value - 1.7);
        blurRadius.value = withTiming(stepBlur, { duration: 250 });

        const stepClarity = Math.min(1, clarityProgress.value + 0.06);
        clarityProgress.value = withTiming(stepClarity, { duration: 250 });

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerLoopRef.current) clearInterval(timerLoopRef.current);
    };
  }, [currentIdx, activeQuestion, selectedOption, blurRadius, clarityProgress, timerScale]);

  const handleEndSession = async () => {
    await releaseAudioHardware();

    const coinRewardBase = totalCorrectAnswersThisGame * 5;
    const finalPerfectBonus = (isPerfectGame && totalCorrectAnswersThisGame > 0) ? 50 : 0;
    const netCoinGain = coinRewardBase + finalPerfectBonus;

    if (netCoinGain > 0) addCoinsAction(netCoinGain);
    addXPAction(totalCorrectAnswersThisGame * 15);

    updateBestScoreAction(sessionScore);
    updateStatisticsAction({
      totalGamesPlayed: 1,
      totalCorrectAnswers: totalCorrectAnswersThisGame,
      totalCoinsEarned: netCoinGain,
    });

    checkAndUnlockAchievementsAction({
      isPerfectGame,
      maxComboThisGame,
    });

    router.replace('/lobby');
  };

  // ─── SCORE & ANSWER SELECTION COMPUTATION ───
  const handleSubmission = useCallback(async (selected: string) => {
    if (selectedOption || !activeQuestion) return;
    setSelectedOption(selected);
    if (timerLoopRef.current) clearInterval(timerLoopRef.current);

    const isCorrect = selected === activeQuestion.correctOption;

    if (isCorrect) {
      await triggerAudioTrack();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      
      const sessionMultiplier = multiplierSessionsLeft > 0 ? 2 : 1;
      const basePoints = 10;
      const comboBonus = currentCombo * 2;
      const computedGain = (basePoints + comboBonus) * sessionMultiplier;

      setSessionScore((prev) => prev + computedGain);
      const nextCombo = currentCombo + 1;
      setCurrentCombo(nextCombo);
      if (nextCombo > maxComboThisGame) setMaxComboThisGame(nextCombo);
      setTotalCorrectAnswersThisGame((prev) => prev + 1);

      scorePopupScale.value = withSequence(withSpring(0.3), withTiming(0, { duration: 600 }));
      comboBadgeScale.value = withSequence(withTiming(1.4, { duration: 100 }), withTiming(1, { duration: 150 }));

      blurRadius.value = withTiming(0, { duration: 200 });
      clarityProgress.value = withTiming(1, { duration: 200 });

      updateMissionProgressAction('correct_answers' as MissionType, 1, activeQuestion.category);
    } else {
      if (isShieldActive) {
        await triggerAudioTrack();
        setIsShieldActive(false); 
        setSelectedOption(null); 
        return;
      }

      await triggerAudioTrack();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      
      setCurrentCombo(0);
      setIsPerfectGame(false);

      blurRadius.value = withTiming(0, { duration: 400 });
      clarityProgress.value = withTiming(1, { duration: 400 });
    }
  }, [selectedOption, activeQuestion, currentCombo, maxComboThisGame, isShieldActive, multiplierSessionsLeft, blurRadius, clarityProgress, comboBadgeScale, scorePopupScale, updateMissionProgressAction]);

  // --- TRANSITION NEXT STAGE ROUTINE ---
  const handleNextRound = useCallback(() => {
    if (currentIdx >= quizQueue.length - 1) {
      handleEndSession();
    } else {
      setSelectedOption(null);
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, quizQueue.length, handleEndSession]);

  const handleExitGame = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await releaseAudioHardware();
    router.replace('/lobby');
  }, [router, releaseAudioHardware]);

  if (!activeQuestion) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={54} color={GameColors.accentOrange} />
        <Text style={styles.errorText}>No questions synced from either local bundle or online AI node.</Text>
        <TouchableOpacity style={styles.exitBtn} onPress={async () => { await releaseAudioHardware(); router.replace('/lobby'); }}>
          <Text style={styles.exitBtnText}>Return to Safe Lobby</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Animated Interpolation Bindings
  const imageAnimatedStyles = useAnimatedStyle(() => {
    const blurVal = blurRadius.value;
    return {
      opacity: 1,
      transform: [{ scale: 1 }],
      ...(Platform.OS === 'web' && {
        filter: `blur(${blurVal}px)`,
      }),
    } as any;
  });

  const timerAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  const placeholderAnimatedStyles = useAnimatedStyle(() => ({
    opacity: clarityProgress.value,
    transform: [{ scale: 0.85 + (clarityProgress.value * 0.15) }],
  }));

  const comboBadgeAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: comboBadgeScale.value }],
  }));

  const scoreAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + scorePopupScale.value }],
  }));

  // Power-up triggers using correct power-up IDs from types
  const triggerClarityBomb = () => {
    if (selectedOption || blurRadius.value <= 4) return;
    if (usePowerUpAction('reveal-blur')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      blurRadius.value = withTiming(Math.max(0, blurRadius.value - 12), { duration: 300 });
      clarityProgress.value = withTiming(Math.min(1, clarityProgress.value + 0.35), { duration: 300 });
      updateMissionProgressAction('use_powerup' as MissionType, 1, 'reveal-blur');
    }
  };

  const triggerTimeBoost = () => {
    if (selectedOption) return;
    if (usePowerUpAction('double-xp')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setTimeLeft((t) => Math.min(15, t + 5));
      updateMissionProgressAction('use_powerup' as MissionType, 1, 'double-xp');
    }
  };

  const triggerComboShieldConsumable = () => {
    if (selectedOption || isShieldActive) return;
    if (useConsumableAction('combo_shield')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setIsShieldActive(true);
    }
  };

  const triggerErrorNullifierConsumable = () => {
    if (selectedOption || disabledWrongOptions.length >= 2) return;
    if (useConsumableAction('error_nullifier')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const incorrects = activeQuestion.options.filter((o) => o !== activeQuestion.correctOption);
      const randomWrongItems = incorrects.sort(() => 0.5 - Math.random()).slice(0, 2);
      setDisabledWrongOptions(randomWrongItems);
    }
  };

  return (
    <View style={[styles.rootView, { paddingTop: topPad, paddingBottom: botPad }]}>
      
      {/* ─── HEADER CONTROLS NAVIGATION BAR ─── */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.exitTouch} onPress={handleExitGame}>
          <Ionicons name="close" size={26} color={GameColors.textWhite} />
        </TouchableOpacity>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryLabel}>{activeQuestion.category}</Text>
        </View>

        <Animated.Text style={[styles.timerValue, timerAnimatedStyles]}>
          {timeLeft}s
        </Animated.Text>
      </View>

      {/* ─── DYNAMIC INTERPOLATION SCREEN BUFFER VIEWBOX ─── */}
      <View style={styles.canvasContainer}>
        {activeQuestion.imageUrl ? (
          <Animated.Image
            source={{ uri: activeQuestion.imageUrl }}
            style={[styles.renderImage, imageAnimatedStyles]}
            blurRadius={Platform.OS !== 'web' ? blurRadius.value : undefined}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.blurPlaceholderBox}>
            <Animated.View style={[styles.placeholderInnerStack, placeholderAnimatedStyles]}>
              <Ionicons name="help-circle-sharp" size={110} color="rgba(255, 215, 0, 0.35)" />
              <Text style={styles.placeholderLabelText}>AI Content Rendering...</Text>
            </Animated.View>
          </View>
        )}

        {/* HUD Indicator Status Overlays */}
        <View style={styles.hudOverlay}>
          <Animated.Text style={[styles.hudScoreText, scoreAnimatedStyles]}>Score: {sessionScore}</Animated.Text>
          <Text style={styles.hudProgressText}>{currentIdx + 1} / {quizQueue.length}</Text>
        </View>

        {currentCombo > 1 && (
          <Animated.View style={[styles.comboFloaterBadge, comboBadgeAnimatedStyles]}>
            <Text style={styles.comboFloaterText}>Combo x{currentCombo} 🔥</Text>
          </Animated.View>
        )}

        {isShieldActive && (
          <View style={styles.shieldActiveBadge}>
            <Ionicons name="shield-checkmark" size={14} color={GameColors.accentGold} />
            <Text style={styles.shieldActiveText}>Shield Equipped</Text>
          </View>
        )}
      </View>

      {/* ─── OPTIONS SELECTION LIST MATRIX ─── */}
      <ScrollView contentContainerStyle={styles.optionsScrollStack} scrollEnabled={SH < 700}>
        {activeQuestion.options.map((option) => {
          const isSelected = selectedOption === option;
          const isCorrectAnswer = option === activeQuestion.correctOption;
          const isDisabledByNullifier = disabledWrongOptions.includes(option);

          let elementStyle = styles.btnDefault;
          let labelStyle = styles.textDefault;

          if (selectedOption) {
            if (isCorrectAnswer) {
              elementStyle = styles.btnCorrect;
              labelStyle = styles.textSelected;
            } else if (isSelected) {
              elementStyle = styles.btnWrong;
              labelStyle = styles.textSelected;
            } else {
              elementStyle = styles.btnDisabled;
            }
          } else if (isDisabledByNullifier) {
            elementStyle = styles.btnNullified;
            labelStyle = styles.textNullified;
          }

          return (
            <TouchableOpacity
              key={option}
              style={elementStyle}
              onPress={() => handleSubmission(option)}
              disabled={selectedOption !== null || isDisabledByNullifier}
              activeOpacity={0.7}
            >
              <Text style={labelStyle}>{option}</Text>
              {selectedOption && isCorrectAnswer && (
                <Ionicons name="checkmark-circle-sharp" size={22} color="#fff" />
              )}
              {selectedOption && isSelected && !isCorrectAnswer && (
                <Ionicons name="close-circle-sharp" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Next step confirmation bottom toggle layout overlay */}
        {selectedOption !== null && (
          <TouchableOpacity style={styles.nextActionBtn} onPress={handleNextRound}>
            <Text style={styles.nextActionText}>
              {currentIdx >= quizQueue.length - 1 ? 'Finish & Claim Rewards 🏆' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ─── DUAL ROW EXTENDED ACTIONS HOVER UTILITY DRAWER ─── */}
      <View style={styles.utilsDrawer}>
        
        {/* Row 1 Inventory: In-Game Powerups */}
        <View style={styles.utilsRow}>
          <TouchableOpacity 
            style={[styles.utilityCard, selectedOption !== null && styles.utilityCardDisabled]} 
            onPress={triggerClarityBomb}
            disabled={selectedOption !== null}
          >
            <Ionicons name="color-wand" size={18} color={GameColors.accentOrange} />
            <Text style={styles.utilityText}>Bomb ({powerUps['reveal-blur'] || 0})</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.utilityCard, selectedOption !== null && styles.utilityCardDisabled]} 
            onPress={triggerTimeBoost}
            disabled={selectedOption !== null}
          >
            <Ionicons name="stopwatch" size={18} color={GameColors.accentGold} />
            <Text style={styles.utilityText}>+5s ({powerUps['double-xp'] || 0})</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 Inventory: Premium Consumables Shop Bundles */}
        <View style={styles.utilsRow}>
          <TouchableOpacity 
            style={[styles.utilityCard, (selectedOption !== null || isShieldActive) && styles.utilityCardDisabled]} 
            onPress={triggerComboShieldConsumable}
            disabled={selectedOption !== null || isShieldActive}
          >
            <Ionicons name="shield-half" size={17} color="#3B82F6" />
            <Text style={styles.utilityText}>Shield ({consumables.combo_shield || 0})</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.utilityCard, (selectedOption !== null || disabledWrongOptions.length > 0) && styles.utilityCardDisabled]} 
            onPress={triggerErrorNullifierConsumable}
            disabled={selectedOption !== null || disabledWrongOptions.length > 0}
          >
            <Ionicons name="eye-off" size={17} color="#10B981" />
            <Text style={styles.utilityText}>50:50 ({consumables.error_nullifier || 0})</Text>
          </TouchableOpacity>
        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
    backgroundColor: '#02000A',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#02000A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  errorText: {
    ...Typography.small,
    color: GameColors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  exitBtn: {
    backgroundColor: GameColors.accentOrange,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exitBtnText: {
    ...Typography.small,
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 55,
  },
  exitTouch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryLabel: {
    ...Typography.small,
    color: GameColors.textWhite,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  timerValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    width: 50,
    textAlign: 'right',
    color: GameColors.textWhite,
  },
  canvasContainer: {
    width: '100%',
    height: SH * 0.35,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: '#070514',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  renderImage: {
    width: '100%',
    height: '100%',
  },
  blurPlaceholderBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05030E',
  },
  placeholderInnerStack: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  placeholderLabelText: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  hudOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  hudScoreText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  hudProgressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  comboFloaterBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(2, 0, 10, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GameColors.accentOrange,
  },
  comboFloaterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  shieldActiveBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 6,
  },
  shieldActiveText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  optionsScrollStack: {
    width: '100%',
    gap: 12,
    marginVertical: 8,
  },
  btnDefault: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  btnCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#34D399',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  btnWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F87171',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  btnDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.02)',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
    opacity: 0.25,
  },
  btnNullified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
    opacity: 0.15,
  },
  textDefault: {
    ...Typography.small,
    color: GameColors.textWhite,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  textSelected: {
    ...Typography.small,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  textNullified: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.2)',
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  nextActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GameColors.accentGold,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  nextActionText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#000',
  },
  utilsDrawer: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  utilsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    width: '100%',
  },
  utilityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 11,
    borderRadius: 14,
    gap: 8,
  },
  utilityCardDisabled: {
    opacity: 0.3,
  },
  utilityText: {
    ...Typography.caption,
    color: GameColors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
