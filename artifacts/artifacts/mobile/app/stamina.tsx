/**
 * stamina.tsx — Stamina screen (placeholder).
 *
 * Reachable from the lobby stamina pill. Shows the real values from the user
 * store (active bar, reserve, refill rate) and offers the one refill action
 * that already exists: spending gems. Watching an ad for stamina stays on the
 * lobby AdMob button, which owns the daily-cap logic.
 */
import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { ProgressBar } from '@/components/ProgressBar';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import {
  MAX_ENERGY,
  STAMINA_PER_GAME,
  ENERGY_REFILL_INTERVAL_MIN,
  ENERGY_REFILL_GEM_COST,
} from '@/constants/economy';

export default function StaminaScreen() {
  // Records persisted before these fields existed hydrate as undefined, which
  // would render "undefined" and poison the progress maths — default them here.
  const energy = useUserStore((s) => s.energy ?? 0);
  const staminaReserve = useUserStore((s) => s.staminaReserve ?? 0);
  const gems = useUserStore((s) => s.gems ?? 0);
  const refillEnergyWithGems = useUserStore((s) => s.refillEnergyWithGems);

  const isFull = energy >= MAX_ENERGY;

  const handleRefill = useCallback(() => {
    // The store re-checks both conditions inside its transaction, so a double
    // tap can never charge twice; here we only pick the right message back.
    const ok = refillEnergyWithGems(ENERGY_REFILL_GEM_COST);
    if (!ok) {
      const current = useUserStore.getState();
      if (current.energy >= MAX_ENERGY) {
        Alert.alert('Already full', 'Your stamina bar is already at maximum.');
      } else {
        Alert.alert('Not enough gems', `A full refill costs ${ENERGY_REFILL_GEM_COST} gems.`);
      }
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [refillEnergyWithGems]);

  return (
    <PlaceholderScreen
      title="Stamina"
      icon="flash"
      subtitle={`Each round costs ${STAMINA_PER_GAME} stamina. You regain 1 every ${ENERGY_REFILL_INTERVAL_MIN} minutes.`}
      testID="stamina-screen"
      headerRight={
        <View style={styles.gemPill}>
          <Ionicons name="diamond" size={12} color="#CE93D8" />
          <Text style={styles.gemPillText}>{gems}</Text>
        </View>
      }
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Active</Text>
          <Text style={styles.rowValue}>{energy} / {MAX_ENERGY}</Text>
        </View>
        <ProgressBar progress={MAX_ENERGY > 0 ? energy / MAX_ENERGY : 0} color={GameColors.accentGreen} />
        <Text style={styles.hint}>
          {isFull ? 'Your bar is full.' : 'Refills over time while you are away.'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Reserve</Text>
          <Text style={styles.rowValue}>{staminaReserve}</Text>
        </View>
        <Text style={styles.hint}>
          Earned from ads and rewards. Used automatically once the active bar runs out.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.refillBtn, isFull && styles.refillBtnDisabled]}
        onPress={handleRefill}
        disabled={isFull}
        testID="stamina-refill"
      >
        <Ionicons
          name="diamond"
          size={16}
          color={isFull ? GameColors.textSecondary : GameColors.backgroundPrimary}
        />
        <Text style={[styles.refillText, isFull && styles.refillTextDisabled]}>
          {isFull ? 'Stamina full' : `Refill for ${ENERGY_REFILL_GEM_COST} gems`}
        </Text>
      </TouchableOpacity>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...Typography.bodyMedium,
    color: GameColors.textWhite,
  },
  rowValue: {
    ...Typography.bodyMedium,
    color: GameColors.accentGold,
  },
  hint: {
    ...Typography.small,
    color: GameColors.textSecondary,
  },
  gemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(206,147,216,0.15)',
  },
  gemPillText: {
    ...Typography.small,
    color: '#CE93D8',
  },
  refillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: GameColors.accentGold,
  },
  refillBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  refillText: {
    ...Typography.bodyMedium,
    color: GameColors.backgroundPrimary,
  },
  refillTextDisabled: {
    color: GameColors.textSecondary,
  },
});
