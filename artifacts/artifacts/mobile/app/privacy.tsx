import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top + 12;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom + 24;

  return (
    <AnimatedBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={styles.spacer} />
        </View>
        <Text style={styles.body}>
          GUESSAi stores the player profile needed to run the game: nickname, coins, gems, XP,
          inventory, and progress. Authentication uses Google Sign-In. We do not sell personal
          data. You can delete your game account from Settings → Delete Account. This in-app
          policy covers the current 1.0.0 client; a hosted policy URL can be added later without
          changing this screen.
        </Text>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spacer: { width: 44 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 22 },
  body: { ...Typography.body, color: GameColors.textSecondary, lineHeight: 22 },
});
