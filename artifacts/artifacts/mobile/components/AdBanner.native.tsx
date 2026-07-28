/**
 * AdBanner — NATIVE build (iOS / Android).
 *
 * Metro resolves this file on native platforms.  When react-native-google-mobile-ads
 * is linked (EAS production/preview build) it renders a real BannerAd component.
 * In Expo Go the native module is absent so it falls back to the placeholder.
 */

import React, { useCallback } from 'react';
import { NativeModules, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { AD_UNIT_IDS } from '@/services/AdService';

// ─── Native availability ──────────────────────────────────────────────────
const ADMOB_LINKED = !!NativeModules.RNGoogleMobileAds;

let NativeBannerAd: React.ComponentType<any> | null = null;
let NativeBannerAdSize: any = null;

if (ADMOB_LINKED) {
  try {
    const m = require('react-native-google-mobile-ads');
    NativeBannerAd     = m.BannerAd;
    NativeBannerAdSize = m.BannerAdSize;
  } catch {
    NativeBannerAd = null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────

interface AdBannerProps {
  visible?: boolean;
  size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE';
}

export const AdBanner: React.FC<AdBannerProps> = ({
  visible = true,
  size = 'BANNER',
}) => {
  const handleError = useCallback((err: Error) => {
    if (__DEV__) console.warn('[AdBanner] load error:', err);
  }, []);

  if (!visible) return null;

  if (NativeBannerAd && NativeBannerAdSize) {
    return (
      <View style={styles.wrapper}>
        <NativeBannerAd
          unitId={AD_UNIT_IDS.banner}
          size={NativeBannerAdSize[size] ?? NativeBannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
          onAdFailedToLoad={handleError}
        />
      </View>
    );
  }

  // Placeholder for Expo Go (native module not linked)
  return (
    <View style={styles.placeholder}>
      <Ionicons name="megaphone-outline" size={14} color={GameColors.textSecondary} />
      <Text style={styles.text}>Advertisement</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GameColors.border,
    borderStyle: 'dashed',
    marginHorizontal: 18,
  },
  text: {
    ...Typography.small,
    color: GameColors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
  },
});
