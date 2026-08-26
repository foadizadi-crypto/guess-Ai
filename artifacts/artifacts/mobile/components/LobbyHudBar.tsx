import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameColors } from '@/theme/colors';
import { formatCoins } from '@/utils';

interface LobbyHudBarProps {
  xpProgress: number;
  xpLabel: string;
  xpDetail?: string;
  coins: number;
  gems: number;
  onPressXp: () => void;
  onPressCoins: () => void;
  onPressGems: () => void;
}

/**
 * Top-of-lobby resource HUD, left-to-right: XP, Coins, Gems.
 *
 * XP has a real maximum (the current level), so it uses a fill bar plus the
 * live numeric progress. Coins and gems are unbounded wallets, so a fill bar
 * would be fake — those stay as live numbers that update from the user store.
 */
export function LobbyHudBar({
  xpProgress,
  xpLabel,
  xpDetail,
  coins,
  gems,
  onPressXp,
  onPressCoins,
  onPressGems,
}: LobbyHudBarProps) {
  const fill = Math.min(1, Math.max(0, xpProgress));

  return (
    <View pointerEvents="box-none" style={styles.row}>
      <Pressable
        accessibilityLabel="xp"
        onPress={onPressXp}
        style={styles.xpPill}
      >
        <View style={[styles.xpFill, { width: `${fill * 100}%` }]} />
        <Text style={styles.xpLabel} numberOfLines={1}>{xpLabel}</Text>
        {xpDetail ? (
          <Text style={styles.xpDetail} numberOfLines={1}>{xpDetail}</Text>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityLabel="coin"
        onPress={onPressCoins}
        style={styles.pill}
      >
        <Image source={require('../assets/icon/coin.webp')} style={styles.icon} />
        <Text style={styles.value} numberOfLines={1}>{formatCoins(coins)}</Text>
      </Pressable>

      <Pressable
        accessibilityLabel="gem"
        onPress={onPressGems}
        style={styles.pill}
      >
        <Image source={require('../assets/icon/gem.webp')} style={styles.icon} />
        <Text style={styles.value} numberOfLines={1}>{gems.toLocaleString()}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpPill: {
    flex: 1.35,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 10, 24, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
    overflow: 'hidden',
  },
  xpFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 215, 0, 0.32)',
  },
  xpLabel: {
    color: GameColors.textWhite,
    fontSize: 11,
    fontWeight: '800',
    zIndex: 1,
  },
  xpDetail: {
    flex: 1,
    color: GameColors.accentGold,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    zIndex: 1,
  },
  pill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 10, 24, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  icon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  value: {
    flex: 1,
    color: GameColors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
});
