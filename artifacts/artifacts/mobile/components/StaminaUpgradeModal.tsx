/**
 * Stamina upgrade popup. Purchase/progression is `upgradeStaminaSource` only.
 * Caps and prices come from STAMINA_UPGRADE_LEVELS — do not duplicate them.
 */
import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticsService } from '@/services/HapticsService';
import { GradientButton } from '@/components/GradientButton';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import {
  STAMINA_UPGRADE_LEVELS,
  MAX_STAMINA_UPGRADE_LEVEL,
  getEnergyCap,
  getUpgradeGemCost,
  getUpgradeCoinCost,
  isFirstUpgradeOfferActive,
  FIRST_UPGRADE_OFFER_HOURS,
} from '@/constants/economy';

function notify(title: string, body: string) {
  if (Platform.OS === 'web' && typeof globalThis.alert === 'function') {
    globalThis.alert(`${title}\n\n${body}`);
    return;
  }
  Alert.alert(title, body);
}

interface StaminaUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function StaminaUpgradeModal({ visible, onClose }: StaminaUpgradeModalProps) {
  const gems = useUserStore((s) => s.gems ?? 0);
  const coins = useUserStore((s) => s.coins ?? 0);
  const staminaSourceLevel = useUserStore((s) => s.staminaSourceLevel ?? 0);
  const accountCreatedAt = useUserStore((s) => s.accountCreatedAt);
  const upgradeStaminaSource = useUserStore((s) => s.upgradeStaminaSource);

  const currentCap = getEnergyCap(staminaSourceLevel);
  const atMax = staminaSourceLevel >= MAX_STAMINA_UPGRADE_LEVEL;
  const nextUpgrade = atMax ? null : STAMINA_UPGRADE_LEVELS[staminaSourceLevel + 1];
  const offerActive = isFirstUpgradeOfferActive(accountCreatedAt, staminaSourceLevel);
  const nextUpgradeCost = nextUpgrade
    ? getUpgradeGemCost(nextUpgrade.level, accountCreatedAt, staminaSourceLevel)
    : null;
  const nextUpgradeCoinCost = nextUpgrade ? getUpgradeCoinCost(nextUpgrade.level) : null;
  const nextAvailable = !!nextUpgrade && (nextUpgradeCost != null || nextUpgradeCoinCost != null);

  const handleUpgrade = (payWith: 'gems' | 'coins') => {
    if (!nextUpgrade) return;
    if (payWith === 'gems' && nextUpgradeCost == null) return;
    if (payWith === 'coins' && nextUpgradeCoinCost == null) return;
    hapticsService.impact(0);
    const ok = upgradeStaminaSource(payWith);
    if (!ok) {
      if (payWith === 'coins') {
        notify(
          'Not enough coins',
          `Upgrading to Level ${nextUpgrade.level} costs ${nextUpgradeCoinCost!.toLocaleString()} coins. You have ${coins}.`,
        );
      } else {
        notify(
          'Not enough gems',
          `Upgrading to Level ${nextUpgrade.level} costs ${nextUpgradeCost} gems. You have ${gems}.`,
        );
      }
      return;
    }
    hapticsService.notification(1);
    notify(
      'Source upgraded!',
      `Stamina source is now Level ${nextUpgrade.level}: cap ${nextUpgrade.cap}, +1 stamina every ${nextUpgrade.refillIntervalMin} minutes.`,
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Upgrade Stamina</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="close-stamina-upgrade" hitSlop={10}>
              <Ionicons name="close" size={22} color={GameColors.textWhite} />
            </TouchableOpacity>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current cap</Text>
              <Text style={styles.summaryValue}>{currentCap}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Next cap</Text>
              <Text style={styles.summaryValue}>{nextUpgrade ? nextUpgrade.cap : 'Max'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Upgrade level</Text>
              <Text style={styles.summaryValue}>
                {staminaSourceLevel} / {MAX_STAMINA_UPGRADE_LEVEL}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Next upgrade</Text>
              <Text style={styles.summaryValue}>{nextAvailable ? 'Available' : 'Not available'}</Text>
            </View>
          </View>

          {offerActive && nextUpgradeCost != null && (
            <View style={styles.offerBanner}>
              <Ionicons name="flame" size={14} color="#FF7043" />
              <Text style={styles.offerText}>
                Launch offer: first upgrade half price for {FIRST_UPGRADE_OFFER_HOURS}h!
              </Text>
            </View>
          )}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {STAMINA_UPGRADE_LEVELS.map((lvl) => {
              const owned = staminaSourceLevel >= lvl.level;
              const isNext = lvl.level === staminaSourceLevel + 1;
              const perDay = Math.floor((24 * 60) / lvl.refillIntervalMin);
              const discounted =
                isNext &&
                nextUpgradeCost != null &&
                lvl.gemCost != null &&
                nextUpgradeCost < lvl.gemCost;
              return (
                <View
                  key={lvl.level}
                  style={[
                    styles.upgradeRow,
                    owned && styles.upgradeRowOwned,
                    isNext && styles.upgradeRowNext,
                  ]}
                >
                  <View style={styles.upgradeRowInfo}>
                    <Text style={styles.upgradeRowTitle}>
                      {lvl.level === 0 ? 'Base Source' : `Level ${lvl.level}`}
                    </Text>
                    <Text style={styles.upgradeRowDetail}>
                      Cap {lvl.cap} · +1 every {lvl.refillIntervalMin} min · {perDay}/day
                    </Text>
                  </View>
                  {owned ? (
                    <Ionicons name="checkmark-circle" size={22} color={GameColors.accentGreen} />
                  ) : isNext && nextAvailable ? (
                    <View style={styles.upgradePriceCol}>
                      {nextUpgradeCoinCost != null && (
                        <View style={styles.upgradePrice}>
                          <Ionicons name="logo-bitcoin" size={12} color={GameColors.accentGold} />
                          <Text style={[styles.upgradePriceText, { color: GameColors.accentGold }]}>
                            {nextUpgradeCoinCost.toLocaleString()}
                          </Text>
                        </View>
                      )}
                      {nextUpgradeCost != null && (
                        <View style={styles.upgradePrice}>
                          <Ionicons name="diamond" size={12} color="#CE93D8" />
                          {discounted && (
                            <Text style={styles.upgradePriceStrike}>{lvl.gemCost}</Text>
                          )}
                          <Text style={styles.upgradePriceText}>{nextUpgradeCost}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Ionicons name="lock-closed" size={16} color={GameColors.textSecondary} />
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            {nextUpgrade && nextAvailable ? (
              <>
                {nextUpgradeCoinCost != null && (
                  <GradientButton
                    title={`Upgrade to Level ${nextUpgrade.level} — ${nextUpgradeCoinCost.toLocaleString()} Coins`}
                    onPress={() => handleUpgrade('coins')}
                  />
                )}
                {nextUpgradeCost != null && (
                  <GradientButton
                    title={`Upgrade to Level ${nextUpgrade.level} — ${nextUpgradeCost} Gems`}
                    onPress={() => handleUpgrade('gems')}
                  />
                )}
              </>
            ) : (
              <View style={styles.maxedBanner}>
                <Ionicons name="trophy" size={16} color={GameColors.accentGold} />
                <Text style={styles.maxedText}>Fully upgraded — maximum source power!</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 14, 36, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  sheet: {
    maxHeight: '86%',
    borderRadius: 20,
    padding: 16,
    backgroundColor: GameColors.backgroundPrimary,
    borderWidth: 1,
    borderColor: GameColors.border,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.header,
    fontSize: 20,
    color: GameColors.textWhite,
  },
  summary: {
    gap: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.small,
    color: GameColors.textSecondary,
  },
  summaryValue: {
    ...Typography.semibold,
    fontSize: 14,
    color: GameColors.accentGold,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,112,67,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,112,67,0.5)',
  },
  offerText: {
    ...Typography.small,
    color: '#FFAB91',
    flexShrink: 1,
  },
  list: {
    maxHeight: 220,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.border,
  },
  upgradeRowOwned: {
    borderColor: 'rgba(76,175,80,0.45)',
  },
  upgradeRowNext: {
    borderColor: GameColors.accentGold,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  upgradeRowInfo: {
    gap: 2,
    flexShrink: 1,
  },
  upgradeRowTitle: {
    ...Typography.semibold,
    fontSize: 14,
    color: GameColors.textWhite,
  },
  upgradeRowDetail: {
    ...Typography.small,
    color: GameColors.textSecondary,
  },
  upgradePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(206,147,216,0.18)',
  },
  upgradePriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  upgradePriceText: {
    ...Typography.semibold,
    fontSize: 13,
    color: '#CE93D8',
  },
  upgradePriceStrike: {
    ...Typography.small,
    fontSize: 11,
    color: GameColors.textSecondary,
    textDecorationLine: 'line-through',
  },
  actions: {
    gap: 8,
    paddingTop: 4,
  },
  maxedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: GameColors.accentGold,
  },
  maxedText: {
    ...Typography.small,
    color: GameColors.accentGold,
  },
});
