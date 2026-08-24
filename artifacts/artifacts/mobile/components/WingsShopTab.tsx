/**
 * WingsShopTab.tsx — Wings section for the Shop screen (Task #40)
 *
 * Displays:
 *  • 5 free wings — unlocked by reaching the required level
 *  • 30 premium wings grouped by rarity (Common / Rare / Legendary)
 *  • Weekly discount wing highlighted at 50% off
 *  • Owned / equipped / locked states with purchase + equip buttons
 *
 * Wing artwork is not yet available; each wing is rendered as a stylised shape
 * with rarity-based colours.  Drop real PNG / Lottie assets at the paths in
 * constants/wings.ts and update this file to use them.
 */
import React, { useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hapticsService } from '@/services/HapticsService';
import { Ionicons } from '@expo/vector-icons';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useUserStore } from '@/store/userStore';
import {
  FREE_WINGS,
  PREMIUM_WINGS,
  ALL_WINGS,
  getWeeklyDiscountWing,
  type WingDef,
  type WingRarity,
} from '@/constants/wings';

// ─── Rarity colour map ────────────────────────────────────────────────────────

const RARITY_COLORS: Record<WingRarity, string> = {
  free:      '#00E676',  // green
  common:    '#B0B0B0',  // silver-grey
  rare:      '#6EC6FF',  // sky blue
  legendary: '#FFD700',  // gold
};

// ─── Tiny wing shape rendered when no artwork is available ────────────────────

interface WingShapeProps {
  rarity: WingRarity;
  size?: number;
}

function WingShape({ rarity, size = 48 }: WingShapeProps) {
  const color = RARITY_COLORS[rarity];
  return (
    <View style={[wingShapeStyles.outer, { width: size, height: size }]}>
      {/* Left "feather" */}
      <View
        style={[
          wingShapeStyles.feather,
          wingShapeStyles.featherLeft,
          { backgroundColor: color, width: size * 0.42, height: size * 0.6, opacity: 0.85 },
        ]}
      />
      {/* Right "feather" */}
      <View
        style={[
          wingShapeStyles.feather,
          wingShapeStyles.featherRight,
          { backgroundColor: color, width: size * 0.42, height: size * 0.6, opacity: 0.85 },
        ]}
      />
      {/* Centre glow dot */}
      <View
        style={[
          wingShapeStyles.dot,
          { backgroundColor: color, width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1 },
        ]}
      />
    </View>
  );
}

const wingShapeStyles = StyleSheet.create({
  outer:       { alignItems: 'center', justifyContent: 'center' },
  feather:     { position: 'absolute', borderRadius: 24, bottom: 0 },
  featherLeft: { left: 0, transform: [{ rotate: '-18deg' }] },
  featherRight:{ right: 0, transform: [{ rotate: '18deg' }] },
  dot:         { position: 'absolute' },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionAccent, { backgroundColor: color }]} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ─── Wing card ────────────────────────────────────────────────────────────────

interface WingCardProps {
  wing: WingDef;
  playerLevel: number;
  owned: boolean;
  equipped: boolean;
  gems: number;
  discountWingId: string;
  onPurchase: (wing: WingDef, gemCost: number) => void;
  onEquip: (wingId: string) => void;
}

function WingCard({
  wing,
  playerLevel,
  owned,
  equipped,
  gems,
  discountWingId,
  onPurchase,
  onEquip,
}: WingCardProps) {
  const color = RARITY_COLORS[wing.rarity];
  const isDiscounted = wing.id === discountWingId && !owned;
  const finalCost = isDiscounted ? Math.floor(wing.gemCost / 2) : wing.gemCost;
  const isFreeWing = wing.rarity === 'free';
  const levelLocked = isFreeWing && wing.unlockLevel !== undefined && playerLevel < wing.unlockLevel;
  const canAfford = gems >= finalCost;

  let btnLabel: string;
  if (equipped)             btnLabel = 'Equipped ✓';
  else if (owned)           btnLabel = 'Equip';
  else if (levelLocked)     btnLabel = `Lv ${wing.unlockLevel}`;
  else if (isFreeWing)      btnLabel = 'Unlock (Free)';
  else                      btnLabel = `${finalCost} 💎`;

  const btnDisabled = levelLocked || (equipped);
  const btnVariant  = equipped ? 'equipped' : owned ? 'equip' : levelLocked ? 'locked' : canAfford ? 'buy' : 'cantafford';

  return (
    <View style={[s.card, { borderColor: `${color}44` }]}>
      {/* Discount badge */}
      {isDiscounted && (
        <View style={s.discountBadge}>
          <Text style={s.discountText}>SALE 50%</Text>
        </View>
      )}

      {/* Wing preview */}
      <View style={[s.previewWrap, { backgroundColor: `${color}18` }]}>
        <WingShape rarity={wing.rarity} size={52} />
      </View>

      {/* Info */}
      <Text style={s.wingName} numberOfLines={1}>{wing.name}</Text>
      <Text style={[s.wingRarity, { color }]}>{wing.rarity.toUpperCase()}</Text>
      <Text style={s.wingDesc} numberOfLines={2}>{wing.description}</Text>

      {/* Action button */}
      <TouchableOpacity
        style={[s.btn, s[`btn_${btnVariant}` as keyof typeof s] as object]}
        disabled={btnDisabled}
        onPress={() => {
          if (owned)        { onEquip(wing.id); return; }
          if (!levelLocked) { onPurchase(wing, finalCost); }
        }}
        activeOpacity={0.8}
      >
        <Text style={[s.btnText, equipped && s.btnTextEquipped]}>{btnLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WingsShopTabProps {
  scrollable?: boolean;
}

export function WingsShopTab({ scrollable = false }: WingsShopTabProps) {
  const gems         = useUserStore((s) => s.gems);
  const level        = useUserStore((s) => s.level);
  const ownedWings   = useUserStore((s) => s.ownedWings);
  const equippedWing = useUserStore((s) => s.equippedWing);
  const purchaseWing = useUserStore((s) => s.purchaseWing);
  const equipWing    = useUserStore((s) => s.equipWing);

  const discountWing = getWeeklyDiscountWing();

  const handlePurchase = useCallback((wing: WingDef, gemCost: number) => {
    if (gems < gemCost) {
      Alert.alert('Not enough gems', `You need ${gemCost} 💎 to unlock "${wing.name}".`);
      return;
    }
    const ok = purchaseWing(wing.id, gemCost);
    if (ok) {
      hapticsService.notification(1);
      // Auto-equip on first purchase
      equipWing(wing.id);
    } else {
      Alert.alert('Already owned', `You already own ${wing.name}.`);
    }
  }, [gems, purchaseWing, equipWing]);

  const handleEquip = useCallback((wingId: string) => {
    const alreadyEquipped = equippedWing === wingId;
    equipWing(alreadyEquipped ? null : wingId);
    hapticsService.impact(0);
  }, [equippedWing, equipWing]);

  // Split premium by rarity
  const commonWings    = PREMIUM_WINGS.filter((w) => w.rarity === 'common');
  const rareWings      = PREMIUM_WINGS.filter((w) => w.rarity === 'rare');
  const legendaryWings = PREMIUM_WINGS.filter((w) => w.rarity === 'legendary');

  const renderGrid = (wings: WingDef[]) => (
    <View style={s.grid}>
      {wings.map((wing) => (
        <WingCard
          key={wing.id}
          wing={wing}
          playerLevel={level}
          owned={ownedWings.includes(wing.id)}
          equipped={equippedWing === wing.id}
          gems={gems}
          discountWingId={discountWing.id}
          onPurchase={handlePurchase}
          onEquip={handleEquip}
        />
      ))}
    </View>
  );

  const content = (
    <>
      {/* Weekly deal callout */}
      <View style={s.dealBanner}>
        <Ionicons name="flash" size={18} color={GameColors.accentGold} />
        <Text style={s.dealText}>
          <Text style={s.dealBold}>{discountWing.name}</Text>
          {'  '}is 50% off this week!
        </Text>
      </View>

      <SectionHeader label="Free Wings" color={RARITY_COLORS.free} />
      {renderGrid(FREE_WINGS)}

      <SectionHeader label="Common Wings" color={RARITY_COLORS.common} />
      {renderGrid(commonWings)}

      <SectionHeader label="Rare Wings" color={RARITY_COLORS.rare} />
      {renderGrid(rareWings)}

      <SectionHeader label="Legendary Wings" color={RARITY_COLORS.legendary} />
      {renderGrid(legendaryWings)}
    </>
  );

  if (scrollable) {
    return <ScrollView contentContainerStyle={s.scrollContent}>{content}</ScrollView>;
  }
  return <View style={s.container}>{content}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:     { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  dealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.30)',
  },
  dealText:  { ...Typography.small, color: GameColors.textWhite, flex: 1 },
  dealBold:  { fontFamily: 'Inter_700Bold', color: GameColors.accentGold },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionLabel:  { ...Typography.bodyMedium, color: GameColors.textWhite },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },

  discountBadge: {
    position: 'absolute',
    top: 6,
    right: -16,
    backgroundColor: GameColors.accentGold,
    paddingHorizontal: 22,
    paddingVertical: 2,
    transform: [{ rotate: '35deg' }],
  },
  discountText: {
    ...Typography.small,
    color: GameColors.backgroundPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },

  previewWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  wingName:   { ...Typography.bodyMedium, color: GameColors.textWhite, textAlign: 'center' },
  wingRarity: { ...Typography.small, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  wingDesc:   { ...Typography.small, color: GameColors.textSecondary, textAlign: 'center', lineHeight: 16 },

  btn: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GameColors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 4,
  },
  btn_equipped:   { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: GameColors.accentGreen },
  btn_equip:      { backgroundColor: 'rgba(255,215,0,0.12)', borderColor: GameColors.accentGold },
  btn_buy:        { backgroundColor: 'rgba(206,147,216,0.18)', borderColor: 'rgba(206,147,216,0.5)' },
  btn_cantafford: { opacity: 0.5 },
  btn_locked:     { opacity: 0.45 },
  btnText:        { ...Typography.small, color: GameColors.textWhite, fontFamily: 'Inter_600SemiBold' },
  btnTextEquipped:{ color: GameColors.accentGreen },
});
