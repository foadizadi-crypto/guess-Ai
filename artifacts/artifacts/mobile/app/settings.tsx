import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView, Platform, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BackButton } from '@/components/BackButton';
import { GlassCard } from '@/components/GlassCard';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { useAudioStore } from '@/store/audioStore';
import { useAdStore } from '@/store/adStore';
import { iapService, IAP_SKUS } from '@/services/IAPService';
import { useRTL } from '@/hooks/useRTL';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { textAlign } = useRTL();
  const { settings, updateSettings, username } = useUserStore();
  const { isMusicEnabled, isSoundEnabled, volume, isMuted, toggleMusic, toggleSound, setVolume, toggleMute } = useAudioStore();
  const { adsRemoved, removeAds } = useAdStore();
  const [removeAdsLoading, setRemoveAdsLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const toggle = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
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
          <View style={styles.settingRow}>
            <Ionicons name="person-outline" size={20} color={GameColors.textSecondary} />
            <Text style={styles.rowLabel}>Nickname</Text>
            <View style={styles.nicknameValueWrap}>
              <Text style={styles.nicknameValue} numberOfLines={1}>
                {username || '—'}
              </Text>
              <Ionicons name="lock-closed" size={13} color={GameColors.textSecondary} />
            </View>
          </View>
        </GlassCard>

        {/* Audio */}
        <Text style={[styles.sectionLabel, { textAlign }]}>Audio</Text>
        <GlassCard style={styles.card} padding={0}>
          <SettingRow
            icon="musical-notes-outline"
            label="Music"
            right={
              <Switch
                value={isMusicEnabled}
                onValueChange={() => toggle(toggleMusic)}
                trackColor={{ false: GameColors.border, true: GameColors.accentGold }}
                thumbColor={GameColors.textWhite}
              />
            }
          />
          <Separator />
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
            icon="mic-off-outline"
            label="Mute All"
            right={
              <Switch
                value={isMuted}
                onValueChange={() => toggle(toggleMute)}
                trackColor={{ false: GameColors.border, true: GameColors.accentRed }}
                thumbColor={GameColors.textWhite}
              />
            }
          />
          <Separator />
          <View style={styles.sliderRow}>
            <Ionicons name="volume-low-outline" size={18} color={GameColors.textSecondary} />
            <View style={styles.sliderTrack}>
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor={GameColors.accentGold}
                maximumTrackTintColor={GameColors.border}
                thumbTintColor={GameColors.accentGold}
              />
            </View>
            <Ionicons name="volume-high-outline" size={18} color={GameColors.textSecondary} />
          </View>
        </GlassCard>

        {/* Gameplay */}
        <Text style={[styles.sectionLabel, { textAlign }]}>Gameplay</Text>
        <GlassCard style={styles.card} padding={0}>
          <SettingRow
            icon="phone-portrait-outline"
            label="Vibration"
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

        {/* Ads */}
        {!adsRemoved && (
          <>
            <Text style={[styles.sectionLabel, { textAlign }]}>Premium</Text>
            <TouchableOpacity
              style={[styles.removeAdsBtn, removeAdsLoading && { opacity: 0.6 }]}
              disabled={removeAdsLoading}
              onPress={async () => {
                setRemoveAdsLoading(true);
                try {
                  const ok = await iapService.purchase(IAP_SKUS.REMOVE_ADS);
                  if (ok) {
                    removeAds();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                } catch (err) {
                  if (__DEV__) console.warn('[Settings] remove-ads purchase error', err);
                } finally {
                  setRemoveAdsLoading(false);
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name={removeAdsLoading ? 'hourglass-outline' : 'star-outline'}
                size={22}
                color={GameColors.backgroundPrimary}
              />
              <Text style={styles.removeAdsText}>
                {removeAdsLoading ? 'Processing…' : 'Remove Ads'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {adsRemoved && (
          <View style={styles.adFreeRow}>
            <Ionicons name="checkmark-circle" size={20} color={GameColors.accentGreen} />
            <Text style={styles.adFreeText}>Ad-Free Experience Active</Text>
          </View>
        )}

        {/* Restore Purchases */}
        <TouchableOpacity
          style={[styles.restoreBtn, restoreLoading && { opacity: 0.5 }]}
          disabled={restoreLoading}
          onPress={async () => {
            setRestoreLoading(true);
            try {
              const restored = await iapService.restoreAdsRemoved();
              if (restored) {
                removeAds();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (err) {
              if (__DEV__) console.warn('[Settings] restore error', err);
            } finally {
              setRestoreLoading(false);
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.restoreText}>
            {restoreLoading ? 'Restoring…' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>
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
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  sliderTrack: { flex: 1 },
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
