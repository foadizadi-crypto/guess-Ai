import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { AvatarFrame } from '@/components/AvatarFrame';
import { BackButton } from '@/components/BackButton';
import { CoinDisplay } from '@/components/CoinDisplay';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import { COIN_PACKAGES, DEFAULT_AVATARS, POWER_UPS } from '@/constants';
import { useAudio } from '@/hooks/useAudio';
import type { Avatar, PowerUpId } from '@/types';

const TAB_NAMES = ['Avatars', 'Power Ups', 'Coins'];
const TAB_WIDTH = (Dimensions.get('window').width - 40) / 3;
const rarityColors: Record<string, string> = {
  Common: GameColors.textSecondary,
  Rare: '#64B5F6',
  Epic: '#CE93D8',
  Legendary: GameColors.accentGold,
};

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(0);
  const [floating, setFloating] = useState<string | null>(null);
  const indicator = useSharedValue(0);
  const coinPulse = useSharedValue(1);
  const { playEffect } = useAudio();
  const coins = useUserStore((s) => s.coins);
  const avatars = useUserStore((s) => s.avatars);
  const selectedAvatarId = useUserStore((s) => s.selectedAvatarId);
  const powerUps = useUserStore((s) => s.powerUps);
  const unlockAvatar = useUserStore((s) => s.unlockAvatar);
  const selectAvatar = useUserStore((s) => s.selectAvatar);
  const buyPowerUp = useUserStore((s) => s.buyPowerUp);
  const mockPurchaseCoins = useUserStore((s) => s.mockPurchaseCoins);

  useEffect(() => {
    indicator.value = withSpring(tab * TAB_WIDTH, { damping: 18, stiffness: 180 });
  }, [indicator, tab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicator.value }],
  }));
  const coinStyle = useAnimatedStyle(() => ({ transform: [{ scale: coinPulse.value }] }));

  const showPurchase = (message: string) => {
    setFloating(message);
    coinPulse.value = withSequence(withSpring(1.18), withSpring(1));
    setTimeout(() => setFloating(null), 1100);
  };

  const buyAvatar = (avatar: Avatar) => {
    if (avatar.unlocked) {
      selectAvatar(avatar.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showPurchase('Equipped');
      return;
    }
    const success = unlockAvatar(avatar.id);
    Haptics.notificationAsync(
      success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    if (success) {
      playEffect('purchase');
      showPurchase(`-${avatar.cost} coins`);
    } else {
      Alert.alert('Not enough coins', `You need ${avatar.cost} coins to unlock ${avatar.name}.`);
    }
  };

  const buyPower = (id: PowerUpId, name: string) => {
    const success = buyPowerUp(id);
    Haptics.notificationAsync(
      success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
    if (success) {
      playEffect('purchase');
      showPurchase('Power-up added');
    } else Alert.alert('Not enough coins', 'Earn more coins by playing games or claiming rewards.');
  };

  const topPad = Platform.OS === 'web' ? 62 : insets.top + 12;
  const bottomPad = Platform.OS === 'web' ? 28 : insets.bottom + 24;

  return (
    <AnimatedBackground>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Shop</Text>
          <Animated.View style={coinStyle}>
            <CoinDisplay amount={coins} size="small" animate />
          </Animated.View>
        </View>
        <View style={styles.tabs}>
          {TAB_NAMES.map((name, index) => (
            <TouchableOpacity key={name} style={styles.tab} onPress={() => setTab(index)}>
              <Ionicons
                name={index === 0 ? 'people-outline' : index === 1 ? 'flash-outline' : 'cash-outline'}
                size={18}
                color={tab === index ? GameColors.accentGold : GameColors.textSecondary}
              />
              <Text style={[styles.tabText, tab === index && styles.tabTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
          <Animated.View style={[styles.indicator, indicatorStyle]} />
        </View>

        {floating && <Text style={styles.floating}>{floating}</Text>}

        {tab === 0 && (
          <View style={styles.grid}>
            {DEFAULT_AVATARS.map((catalogAvatar) => {
              const avatar = avatars.find((item) => item.id === catalogAvatar.id) ?? catalogAvatar;
              const equipped = selectedAvatarId === avatar.id;
              const color = rarityColors[avatar.rarity ?? 'Common'];
              return (
                <View key={avatar.id} style={[styles.avatarCard, equipped && styles.equippedCard]}>
                  <View style={[styles.avatarImage, { borderColor: color }]}>
                    <AvatarFrame imageKey={avatar.imageKey} size={70} locked={!avatar.unlocked} />
                  </View>
                  <Text style={styles.avatarName} numberOfLines={1}>{avatar.name}</Text>
                  <Text style={[styles.rarity, { color }]}>{avatar.rarity}</Text>
                  <Text style={styles.ability} numberOfLines={2}>{avatar.ability}</Text>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      equipped && styles.equippedButton,
                      !avatar.unlocked && coins < avatar.cost && styles.disabledButton,
                    ]}
                    onPress={() => buyAvatar(avatar)}
                    disabled={!avatar.unlocked && coins < avatar.cost}
                  >
                    {equipped ? <Ionicons name="checkmark" size={16} color={GameColors.backgroundPrimary} /> : null}
                    <Text style={styles.actionText}>
                      {equipped ? 'Equipped' : avatar.unlocked ? 'Equip' : `${avatar.cost} coins`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {tab === 1 && (
          <View style={styles.list}>
            {POWER_UPS.map((item) => (
              <View key={item.id} style={styles.powerCard}>
                <View style={styles.powerIcon}><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={26} color={GameColors.accentGold} /></View>
                <View style={styles.powerCopy}>
                  <Text style={styles.powerName}>{item.name}</Text>
                  <Text style={styles.powerDesc}>{item.description}</Text>
                  <Text style={styles.inventory}>Owned: {powerUps[item.id]}</Text>
                </View>
                <TouchableOpacity style={styles.buySmall} onPress={() => buyPower(item.id, item.name)}>
                  <Text style={styles.buySmallText}>{item.cost}</Text>
                  <Ionicons name="logo-bitcoin" size={14} color={GameColors.backgroundPrimary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View style={styles.list}>
            <Text style={styles.sectionHint}>Mock purchase • no payment is processed</Text>
            {COIN_PACKAGES.map((pack, index) => (
              <TouchableOpacity
                key={pack.id}
                style={[styles.coinCard, index === 2 && styles.popularCard]}
                onPress={() => {
                  mockPurchaseCoins(pack.amount);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  showPurchase(`+${pack.amount} coins`);
                }}
              >
                <View style={styles.coinPackIcon}><Ionicons name="logo-bitcoin" size={25} color={GameColors.accentGold} /></View>
                <Text style={styles.coinAmount}>{pack.amount.toLocaleString()} Coins</Text>
                <Text style={styles.coinPrice}>{pack.price}</Text>
                {index === 2 && <Text style={styles.popularLabel}>BEST VALUE</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, minHeight: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { ...Typography.header, color: GameColors.textWhite, fontSize: 28 },
  tabs: { height: 54, flexDirection: 'row', position: 'relative', borderBottomWidth: 1, borderBottomColor: GameColors.border, marginBottom: 20 },
  tab: { width: TAB_WIDTH, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  tabText: { ...Typography.small, color: GameColors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  tabTextActive: { color: GameColors.accentGold },
  indicator: { position: 'absolute', bottom: -2, left: 0, width: TAB_WIDTH, height: 3, borderRadius: 2, backgroundColor: GameColors.accentGold },
  floating: { position: 'absolute', top: 122, alignSelf: 'center', zIndex: 4, color: GameColors.accentGreen, fontFamily: 'Inter_700Bold', fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  avatarCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.055)', borderRadius: 18, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: GameColors.border },
  equippedCard: { borderColor: GameColors.accentGold, backgroundColor: 'rgba(255,215,0,0.09)' },
  avatarImage: { borderWidth: 2, borderRadius: 50, padding: 2, marginBottom: 8 },
  avatarName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 15 },
  rarity: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2 },
  ability: { color: GameColors.textSecondary, fontSize: 11, textAlign: 'center', minHeight: 32, marginVertical: 8 },
  actionButton: { minHeight: 34, width: '100%', borderRadius: 10, backgroundColor: GameColors.accentGold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  equippedButton: { backgroundColor: GameColors.accentGreen },
  disabledButton: { opacity: 0.35 },
  actionText: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold', fontSize: 11 },
  list: { gap: 12 },
  sectionHint: { color: GameColors.textSecondary, textAlign: 'center', fontSize: 12, marginBottom: 4 },
  powerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  powerIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  powerCopy: { flex: 1, gap: 3 },
  powerName: { color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 16 },
  powerDesc: { color: GameColors.textSecondary, fontSize: 12 },
  inventory: { color: GameColors.accentGreen, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  buySmall: { minWidth: 70, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, backgroundColor: GameColors.accentGold, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
  buySmallText: { color: GameColors.backgroundPrimary, fontFamily: 'Inter_700Bold' },
  coinCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: GameColors.border },
  popularCard: { borderColor: GameColors.accentGold },
  coinPackIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,215,0,0.12)', alignItems: 'center', justifyContent: 'center' },
  coinAmount: { flex: 1, color: GameColors.textWhite, fontFamily: 'Inter_700Bold', fontSize: 17 },
  coinPrice: { color: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 16 },
  popularLabel: { position: 'absolute', top: -9, right: 14, color: GameColors.backgroundPrimary, backgroundColor: GameColors.accentGold, fontFamily: 'Inter_700Bold', fontSize: 9, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
});