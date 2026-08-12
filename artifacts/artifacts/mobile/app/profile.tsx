import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, ImageBackground, Switch, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { calculateXPProgress, formatScore, xpInCurrentLevel, xpForCurrentLevel } from '@/utils';

/**
 * Production-Grade Strict TypeScript Player Profile Screen Component
 * File Path: app/profile.tsx (Strict Expo Router TSX Compliance)
 * Synchronized with 1080x2340 resolution metrics and global Zustand user store schema.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // --- 1. Fetching Typed Live Player Global States from User Store Context ---
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

  // Strict tuple compilation mapping layout array
  const stats = [
    ['game-controller-outline', 'Games Played', `${statistics?.totalGamesPlayed ?? 0}`],
    ['trophy-outline', 'Win Rate', `${winRate}%`],
    ['analytics-outline', 'Total Score', formatScore(statistics?.bestScore ?? 0)],
    ['checkmark-circle-outline', 'Correct Answers', `${statistics?.totalCorrectAnswers ?? 0}`],
    ['grid-outline', 'Favorite Category', statistics?.favoriteCategory ? statistics.favoriteCategory[0].toUpperCase() + statistics.favoriteCategory.slice(1) : '—'],
    ['flame-outline', 'Best Streak', `${statistics?.longestStreak ?? 0}`],
  ] as const;

  // Strict layout compiler type calibration helper utility
  const getProportionalStyle = (
    left: string, 
    top: string, 
    width: string, 
    height: string
  ): ViewStyle[] => [
    styles.absoluteRegion,
    {
      left,
      top,
      width,
      height,
      backgroundColor: debugMode ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
      borderWidth: debugMode ? 1 : 0,
      borderColor: '#38bdf8',
    } as ViewStyle
  ];

  return (
    <View style={styles.viewViewportContainer}>
      <ImageBackground
        source={require('../assets/background/profile_bg.png')} 
        style={styles.responsiveImageContainerBg}
        resizeMode="stretch"
      >
        
        {/* --- A. TOP CONTROL HEADER BAR (BACK ACTION CONTROL) --- */}
        <View style={[styles.headerContainerOverlay, { top: topPad }]}>
          <BackButton />
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

        {/* --- C. SCROLLABLE STATISTICS DATA SCROLL BOUNDARY CONTAINER --- */}
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

        {/* --- D. VISUAL INTERFACE GRID ALIGN SWITCH LAYER PANEL --- */}
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

const styles = StyleSheet.create({
  viewViewportContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
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
  titleText: {
    ...Typography.header, 
    color: GameColors.textWhite, 
    fontSize: 26 
  },
  spacerNode: { 
    width: 44 
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
    top: '43%', 
    bottom: 0,
  },
  scrollContentLayout: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitleText: { 
    color: GameColors.textWhite, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 18, 
    marginBottom: 12 
  },
  statsGridMesh: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  statCardNode: { 
    width: '47%', 
    flexGrow: 1, 
    minHeight: 86,
    padding: 12, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.045)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  statIcon: {
    marginBottom: 2,
  },
  statLabelText: { 
    color: GameColors.textSecondary, 
    fontSize: 11 
  },
  statValueText: { 
    color: GameColors.textWhite, 
    fontFamily: 'Inter_700Bold', 
    fontSize: 15,
    marginTop: 2,
  },
  footerNoteText: { 
    color: GameColors.textSecondary, 
    textAlign: 'center', 
    fontSize: 11, 
    marginTop: 24,
    opacity: 0.7
  },
  debugPanel: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
