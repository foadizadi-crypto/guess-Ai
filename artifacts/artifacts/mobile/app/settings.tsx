import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, Text, Switch, ScrollView, Platform, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { onAuthStateChanged } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { useAudioStore } from '@/store/audioStore';
import { useAdStore } from '@/store/adStore';
import { iapService } from '@/services/IAPService';
import { useRTL } from '@/hooks/useRTL';
import { auth } from '@/services/firebase';
import { deleteApplicationAccount } from '@/services/accountService';
import { signOut } from '@/services/authService';
import { useGameStore } from '@/store/gameStore';
import { ROUTES } from '@/navigation/routes';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { textAlign } = useRTL();
  const { settings, updateSettings, username } = useUserStore();
  const { isSoundEnabled, toggleSound } = useAudioStore();
  const { removeAds } = useAdStore();
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(auth.currentUser?.email ?? null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setGoogleEmail(user?.email ?? null);
  }), []);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const toggle = (action: () => void) => {
    hapticsService.impact(0);
    action();
  };

  const clearLocalPlayerData = async () => {
    useUserStore.getState().resetUser();
    useAdStore.getState().resetForAccountDeletion();
    useGameStore.getState().resetGame();
    await Promise.all([
      useUserStore.persist.clearStorage(),
      useAdStore.persist.clearStorage(),
    ]);
  };

  const handleDeleteAccount = () => {
    if (deleteLoading) return;
    Alert.alert(
      'Are you sure?',
      'This permanently deletes your GUESSAi profile, progress, economy, inventory, achievements, and game history. Your Google account will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            const result = await deleteApplicationAccount();
            if (!result.ok) {
              setDeleteLoading(false);
              Alert.alert('Deletion failed', 'Your game data was not deleted. Please try again.');
              return;
            }
            try {
              await clearLocalPlayerData();
              await signOut();
              Alert.alert('Account deleted', 'Your GUESSAi game data has been deleted.', [
                { text: 'OK', onPress: () => router.replace(ROUTES.LOGIN) },
              ]);
            } catch (err) {
              console.warn('[Account] local cleanup failed after server deletion:', err);
              Alert.alert('Account deleted', 'Your game data was deleted. Please sign in again.', [
                { text: 'OK', onPress: () => router.replace(ROUTES.LOGIN) },
              ]);
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.title, { textAlign }]}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { textAlign }]}>Account</Text>
        <GlassCard style={styles.card} padding={0}>
          <TouchableOpacity onPress={() => router.push(ROUTES.PROFILE)}>
            <View style={styles.settingRow}>
              <Ionicons name="person-outline" size={20} color={GameColors.textSecondary} />
              <Text style={styles.rowLabel}>Profile / Nickname</Text>
              <View style={styles.nicknameValueWrap}>
                <Text style={styles.nicknameValue} numberOfLines={1}>
                  {username || '—'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={GameColors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
          <Separator />
          <SettingRow
            icon="mail-outline"
            label="Google Account / Email"
            right={<Text style={styles.valueText} numberOfLines={1}>{googleEmail || '—'}</Text>}
          />
          <Separator />
          <SettingRow
            icon="trash-outline"
            label="Delete Account"
            right={
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
                style={deleteLoading && { opacity: 0.5 }}
                testID="delete-account"
              >
                <Text style={styles.deleteText}>{deleteLoading ? 'Deleting…' : 'Delete'}</Text>
              </TouchableOpacity>
            }
          />
        </GlassCard>

        {/* Game */}
        <Text style={[styles.sectionLabel, { textAlign }]}>Game</Text>
        <GlassCard style={styles.card} padding={0}>
          <SettingRow
            icon="volume-high-outline"
            label="Sound Effects"
            right={
              <Switch
                value={isSoundEnabled}
                onValueChange={() => toggle(toggleSound)}
                trackColor={{ false: GameColors.border, true: GameColors.accentGold }}
                thumbColor={GameColors.textWhite}
              />
            }
          />
          <Separator />
          <SettingRow
            icon="phone-portrait-outline"
            label="Haptic Feedback"
            right={
              <Switch
                value={settings.vibration}
                onValueChange={(v) => { toggle(() => updateSettings({ vibration: v })); }}
                trackColor={{ false: GameColors.border, true: GameColors.accentGold }}
                thumbColor={GameColors.textWhite}
              />
            }
          />
          <Separator />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            right={
              <Switch
                value={settings.notifications}
                onValueChange={(v) => { toggle(() => updateSettings({ notifications: v })); }}
                trackColor={{ false: GameColors.border, true: GameColors.accentGold }}
                thumbColor={GameColors.textWhite}
              />
            }
          />
        </GlassCard>

        {/* Purchases */}
        <Text style={[styles.sectionLabel, { textAlign }]}>Purchases</Text>
        <GlassCard style={styles.card} padding={0}>
          <TouchableOpacity
            disabled={restoreLoading}
            onPress={async () => {
              setRestoreLoading(true);
              try {
                const restored = await iapService.restoreAdsRemoved();
                if (restored) {
                  removeAds();
                  hapticsService.notification(1);
                  Alert.alert('Purchases restored', 'Your previous Ad-Free purchase is active on this device.');
                } else {
                  Alert.alert('Nothing to restore', 'No previous Ad-Free purchase was found.');
                }
              } catch (err) {
                if (__DEV__) console.warn('[Settings] restore error', err);
                Alert.alert('Restore failed', 'Could not reach the App Store or Google Play.');
              } finally {
                setRestoreLoading(false);
              }
            }}
          >
            <SettingRow
              icon="refresh-outline"
              label="Restore Purchases"
              right={<Text style={styles.linkText}>{restoreLoading ? 'Restoring…' : 'Restore'}</Text>}
            />
          </TouchableOpacity>
        </GlassCard>

        {/* About */}
        <Text style={[styles.sectionLabel, { textAlign }]}>About</Text>
        <GlassCard style={styles.card} padding={0}>
          <TouchableOpacity onPress={() => router.push(ROUTES.PRIVACY)}>
            <SettingRow icon="shield-checkmark-outline" label="Privacy Policy" right={<Text style={styles.linkText}>Open</Text>} />
          </TouchableOpacity>
          <Separator />
          <TouchableOpacity onPress={() => router.push(ROUTES.TERMS)}>
            <SettingRow icon="document-text-outline" label="Terms of Service" right={<Text style={styles.linkText}>Open</Text>} />
          </TouchableOpacity>
          <Separator />
          <SettingRow
            icon="information-circle-outline"
            label="App Version"
            right={<Text style={styles.valueText}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>}
          />
        </GlassCard>
      </ScrollView>
    </AnimatedBackground>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

const SettingRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  right: React.ReactNode;
}> = ({ icon, label, right }) => (
  <View style={styles.settingRow}>
    <Ionicons name={icon} size={20} color={GameColors.textSecondary} />
    <Text style={styles.rowLabel}>{label}</Text>
    {right}
  </View>
);

const Separator = () => <View style={styles.sep} />;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  placeholder: { width: 44 },
  title: {
    ...Typography.semibold,
    color: GameColors.textWhite,
    fontFamily: 'Inter_700Bold',
  },
  sectionLabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  card: { overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowLabel: { ...Typography.caption, color: GameColors.textWhite, flex: 1 },
  nicknameValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 160 },
  nicknameValue: { ...Typography.caption, color: GameColors.textSecondary, flexShrink: 1 },
  sep: { height: 1, backgroundColor: GameColors.border, marginHorizontal: 16 },
  valueText: { ...Typography.small, color: GameColors.textSecondary, maxWidth: 180 },
  linkText: { ...Typography.small, color: GameColors.accentGold },
  deleteText: { ...Typography.small, color: GameColors.accentRed },
  removeAdsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: GameColors.accentGold,
    shadowColor: GameColors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginTop: 4,
  },
  removeAdsText: {
    ...Typography.body,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  adFreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  adFreeText: { ...Typography.caption, color: GameColors.accentGreen, fontFamily: 'Inter_500Medium' },
  restoreBtn: { alignSelf: 'center' as const, paddingVertical: 8, paddingHorizontal: 16, marginTop: 4 },
  restoreText: { ...Typography.small, color: GameColors.textSecondary, textDecorationLine: 'underline' as const },
});
