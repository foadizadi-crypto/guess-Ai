import React from 'react';
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

type Doc = 'privacy' | 'terms';

const PRIVACY = [
  'GUESSAi (“the app”) is an image-guessing game. This policy describes the data we process so you can play, compete, and (optionally) see ads or make purchases.',
  'Account: Google Sign-In creates a Firebase Authentication account. We store your Google user id, email (if provided by Google), chosen nickname, game progress, coins, inventory, and game-session summaries.',
  'Gameplay: question answers, scores, streaks, and leaderboard rankings are stored so your progress syncs across devices.',
  'Purchases: Google Play Billing processes payments. We store product ids and restore tokens so Ad-Free and coin packs can be restored. We never see your full payment card details.',
  'Advertising: if you have not purchased Ad-Free, Google AdMob may collect a resettable advertising id and device signals to show ads. You can control ad personalization in your Google account and device settings.',
  'Notifications: if you grant permission, we store a push token to send reminder notifications. You can disable notifications in Settings.',
  'We do not sell personal information. We do not use the camera, microphone, photos, or location.',
  'Retention: account and progress data stay until you delete your in-app account from Settings, which removes game-owned profile and session data associated with your player id.',
  'Children: the app is not directed at children under 13. Do not create an account if you are under 13.',
  'Contact: use Contact Support in Settings, or the support email configured for this build, to request access or deletion help.',
];

const TERMS = [
  'By using GUESSAi you agree to these terms and the Privacy Policy.',
  'The app is provided for entertainment. AI-generated questions and images may be imperfect or unavailable; if generation fails, the round will not start until the service is available again.',
  'Virtual coins, gems, and items have no real-world cash value and are licensed, not sold, except where required by local law. Unused virtual items are not refundable except where Google Play or applicable law requires otherwise.',
  'Do not cheat, abuse other players, or attempt to manipulate leaderboards or rewarded-ad grants.',
  'We may suspend accounts that violate these terms or interfere with the service.',
  'The service is provided “as is”. To the extent allowed by law we are not liable for indirect or consequential losses arising from play, ads, or purchases.',
];

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ doc?: string }>();
  const doc: Doc = params.doc === 'terms' ? 'terms' : 'privacy';
  const title = doc === 'terms' ? 'Terms of Service' : 'Privacy Policy';
  const paragraphs = doc === 'terms' ? TERMS : PRIVACY;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <AnimatedBackground>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <BackButton />
        <Text style={styles.title}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <GlassCard>
          {paragraphs.map((text) => (
            <Text key={text.slice(0, 24)} style={styles.para}>{text}</Text>
          ))}
        </GlassCard>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  title: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    flex: 1,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  para: {
    ...Typography.caption,
    color: GameColors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
});
