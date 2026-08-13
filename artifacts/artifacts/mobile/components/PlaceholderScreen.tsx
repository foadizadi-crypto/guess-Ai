/**
 * PlaceholderScreen — shared shell for screens whose final UI is not built yet.
 *
 * Gives a placeholder route the same frame as a finished screen (animated
 * background, safe-area padding, working back navigation, title) so it can be
 * navigated to and out of like any other screen. Replace a placeholder by
 * swapping its `children` — or by dropping this wrapper entirely — without
 * touching the route or the button that points at it.
 */
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

interface PlaceholderScreenProps {
  /** Screen title shown in the header. */
  title: string;
  /** Ionicon shown in the hero circle. */
  icon: keyof typeof Ionicons.glyphMap;
  /** One-line explanation of what this screen will do. */
  subtitle: string;
  /** Optional live content rendered under the hero. */
  children?: React.ReactNode;
  /** Optional element rendered on the right of the header (e.g. a currency pill). */
  headerRight?: React.ReactNode;
  /** Set false once the real UI lands to drop the "coming soon" note. */
  showComingSoon?: boolean;
  testID?: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  icon,
  subtitle,
  children,
  headerRight,
  showComingSoon = true,
  testID,
}) => {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

  return (
    <AnimatedBackground>
      <ScrollView
        testID={testID}
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton testID="placeholder-back" />
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.headerRight}>{headerRight}</View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={icon} size={40} color={GameColors.accentGold} />
          </View>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>

        {children}

        {showComingSoon && (
          <View style={styles.note}>
            <Ionicons name="construct-outline" size={16} color={GameColors.textSecondary} />
            <Text style={styles.noteText}>Full experience coming soon.</Text>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  hero: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroSubtitle: {
    ...Typography.bodyMedium,
    color: GameColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noteText: {
    ...Typography.small,
    color: GameColors.textSecondary,
  },
});
