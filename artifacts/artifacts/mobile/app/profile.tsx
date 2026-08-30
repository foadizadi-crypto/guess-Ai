import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Switch,
  Pressable,
  DimensionValue,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { hapticsService } from '@/services/HapticsService';
import { useRouter } from 'expo-router';
import { AvatarFrame } from '@/components/AvatarFrame';
import { CoinDisplay } from '@/components/CoinDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { calculateXPProgress, formatScore, xpInCurrentLevel, xpForCurrentLevel } from '@/utils';
import { useAudio } from '@/hooks/useAudio';

const { width: SW, height: SH } = Dimensions.get('window');

/**
 * Strict TypeScript 1080x2340 Active UI Profile Screen Component
 * File Path: app/profile.tsx (Expo Router TypeScript Structure)
 * Integrates haptics, tap audio feeds, and dynamic store bindings safely.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // --- 1. Pulling live player records directly from your real store context ---
  const { 
    username, 
    coins, 
    xp, 
    level, 
    selectedAvatarId, 
    avatars, 
    statistics, 
    equippedCosmetics 
  } = useUserStore();
  
  const currentAvatar = avatars?.find((avatar) => avatar.id === selectedAvatarId);
  const xpInLevel = xpInCurrentLevel(xp);
  const xpLevelCap = xpForCurrentLevel(level);
  const winRate = statistics?.totalGamesPlayed 
    ? Math.round((statistics.totalWins / statistics.totalGamesPlayed) * 100) 
    : 0;
  
  const topPad = Platform.OS === 'web' ? 20 : insets.top + 6;
  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom + 20;

  // Real statistics data matrix layout
  const stats = [
    ['game-controller-outline', 'Games Played', `${statistics?.totalGamesPlayed || 0}`],
    ['trophy-outline', 'Win Rate', `${winRate}%`],
    ['analytics-outline', 'Total Score', formatScore(statistics?.bestScore || 0)],
    ['checkmark-circle-outline', 'Correct Answers', `${statistics?.totalCorrectAnswers || 0}`],
    ['grid-outline', 'Favorite Category', statistics?.favoriteCategory ? statistics.favoriteCategory[0].toUpperCase() + statistics.favoriteCategory.slice(1) : '—'],
    ['flame-outline', 'Best Streak', `${statistics?.longestStreak || 0}`],
  ] as const;

  const { playEffect } = useAudio();

  // --- 2. Unified Touch Interaction Feedback Pipeline ---
  const handleBackNavigation = async () => {
    await hapticsService.impact(1);
    playEffect('button_click');
    router.back();
  };

  // Helper utility to draw clean layout caliper boxes during calibration phases
  const getProportionalStyle = (left: string, top: string, width: string, height: string): ViewStyle[] => [
    styles.absoluteRegion,
    {
      left:   left   as DimensionValue,
      top:    top    as DimensionValue,
      width:  width  as DimensionValue,
      height: height as DimensionValue,
      backgroundColor: debugMode ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
      borderWidth: debugMode ? 1 : 0,
      borderColor: '#38bdf8',
    }
  ];

  return (
    <View style={styles.viewViewportContainer}>
      <ImageBackground
        source={require('../assets/background/profile_bg.webp')} 
        style={styles.responsiveImageContainerBg}
        resizeMode="stretch"
      >
        
        {/* --- A. TOP CONTROL HEADER BAR (BACK BUTTON MESH) --- */}
        <View style={[styles.headerContainerOverlay, { top: topPad }]}>
          <WaveWrapper onPress={handleBackNavigation} style={styles.backButtonTouchWrapper}>
            <View style={styles.backButtonInnerFrame}>
              <Ionicons name="chevron-back" size={24} color={GameColors.textWhite} />
            </View>
          </WaveWrapper>
          <Text style={styles.titleText}>Profile</Text>
          <View style={styles.spacerNode} />
        </View>

        {/* --- B. HERO CHARACTER CONTAINER (AVATAR, NAME, COINS, XP) --- */}
        <View style={getProportionalStyle('5%', '13%', '90%', '28%')}>
          <View style={styles.heroBoxCenterContent}>
            
            <AvatarFrame 
              imageKey={currentAvatar?.imageKey ?? 'abigail'} 
              frameId={equippedCosmetics?.frame} 
              size={80} 
              showLevel 
              level={level} 
            />
            
            <Text style={styles.usernameText}>{username || 'Player'}</Text>
            
            <View style={styles.coinDisplayWrapper}>
              <CoinDisplay amount={coins} size="medium" animate />
            </View>

            {/* Proportional Level Progression Tracker elements */}
            <View style={styles.xpWrap}>
              <View style={styles.xpLabelsRow}>
                <Text style={styles.mutedLevelLabel}>Level {level}</Text>
                <Text style={styles.xpNumericText}>
                  {xpInLevel} / {xpLevelCap === Infinity ? '∞' : xpLevelCap} XP
                </Text>
              </View>
              <ProgressBar progress={calculateXPProgress(xp)} height={7} animated />
            </View>

          </View>
        </View>


        {/* --- C. SCROLLABLE STATISTICS HOUSING OVERLAY --- */}
        <View style={styles.scrollContainerLayoutBoundary}>
          <ScrollView 
            contentContainerStyle={[styles.scrollContentLayout, { paddingBottom: bottomPad }]} 
            showsVerticalScrollIndicator={false}
          >
            
            <Text style={styles.sectionTitleText}>Statistics</Text>
            
            <View style={styles.statsGridMesh}>
              {stats.map(([icon, label, value]) => (
                <View key={label} style={styles.statCardNode}>
                  <Ionicons 
                    name={icon as React.ComponentProps<typeof Ionicons>['name']} 
                    size={20} 
                    color={GameColors.accentGold} 
                    style={styles.statIcon} 
                  />
                  <Text style={styles.statLabelText}>{label}</Text>
                  <Text style={styles.statValueText} numberOfLines={1}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.footerNoteText}>15 categories · one blurred image at a time.</Text>
            
          </ScrollView>
        </View>


        {/* --- D. VISUAL INTERFACE CALIBRATION MESH PANEL --- */}
        <View style={[styles.debugPanel, { bottom: insets.bottom + 20 }]}>
          <Text style={styles.debugText}>Profile Grid Align:</Text>
          <Switch 
            value={debugMode} 
            onValueChange={setDebugMode}
            trackColor={{ false: '#475569', true: '#3b82f6' }}
            thumbColor={debugMode ? '#60a5fa' : '#cbd5e1'}
          />
        </View>

      </ImageBackground>
    </View>
  );
}

// ─── Custom Animated Response Effect Framework Wrappers ───

function WaveWrapper({ style, onPress, children }: any) {
  const waveScale = useSharedValue(0);
  const waveOpacity = useSharedValue(0);

  const handlePressIn = () => {
    waveScale.value = 0.2;
    waveOpacity.value = 0.55;
    waveScale.value = withTiming(1.35, { duration: 400 });
    waveOpacity.value = withTiming(0, { duration: 400 });
  };

  const animatedWaveStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPress={onPress}
      style={[style, { overflow: 'hidden' }]}
    >
      <Animated.View style={animatedWaveStyle} />
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  viewViewportContainer: {
    flex: 1,
    backgroundColor: '#02000A',
  },
  responsiveImageContainerBg: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  absoluteRegion: {
    position: 'absolute',
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerContainerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButtonTouchWrapper: {
    borderRadius: 99,
  },
  backButtonInnerFrame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    ...Typography.header, 
    color: GameColors.textWhite, 
    fontSize: 26,
    fontWeight: 'bold',
  },
  spacerNode: { 
    width: 40 
  },
  heroBoxCenterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  usernameText: { 
    color: GameColors.textWhite, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 22, 
    marginTop: 8 
  },
  coinDisplayWrapper: {
    marginTop: 4,
  },
  xpWrap: { 
    width: '100%', 
    marginTop: 12, 
    gap: 6 
  },
  xpLabelsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  mutedLevelLabel: { 
    color: GameColors.textSecondary, 
    fontSize: 12 
  },
  xpNumericText: { 
    color: GameColors.accentGold, 
    fontFamily: 'Inter_600SemiBold', 
    fontSize: 12 
  },
  scrollContainerLayoutBoundary: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '43%', // Locks the tracking boundary cleanly below the upper hero stats panel cards graphic
    bottom: 80,
  },
  scrollContentLayout: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitleText: { 
    color: GameColors.textWhite, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 18,
    marginBottom: 12,
  },
  statsGridMesh: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCardNode: {
    width: '48%',
    minHeight: 96,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
    marginBottom: 2,
  },
  statIcon: {
    marginBottom: 2,
  },
  statLabelText: {
    color: GameColors.textSecondary,
    fontSize: 11,
  },
  statValueText: {
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerNoteText: {
    color: GameColors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
    marginTop: 24,
    opacity: 0.7,
  },
  debugPanel: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  debugText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
  }
});
