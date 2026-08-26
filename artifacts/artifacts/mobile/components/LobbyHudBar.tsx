import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameColors } from '@/theme/colors';
import { formatCoins } from '@/utils';

interface LobbyHudBarProps {
  xpProgress: number;
  xpLabel: string;
  coins: number;
  gems: number;
  onPressXp: () => void;
  onPressCoins: () => void;
  onPressGems: () => void;
}

/**
 * Top-of-lobby resource HUD.
 * XP is a real progress bar (current level fill). Coins and gems are wallets,
 * so they stay as live numbers — a fake cap bar would be misleading.
 */
export function LobbyHudBar({
  xpProgress,
  xpLabel,
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
        style={styles.pill}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: GameColors.accentGold }]} />
        </View>
        <Text style={styles.value} numberOfLines={1}>{xpLabel}</Text>
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
  track: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  value: {
    flex: 1,
    color: GameColors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
});
