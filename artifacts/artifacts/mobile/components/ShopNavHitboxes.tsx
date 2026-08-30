import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShopHotspot } from '@/components/ShopHotspot';
import {
  SHOP_NAV_HITBOXES,
  type ShopHitboxId,
  type ShopPage,
} from '@/constants/shopHitboxes';

const NAV_PAGE: Record<Extract<ShopHitboxId, `nav_${string}`>, ShopPage> = {
  nav_wings: 'wings',
  nav_stamina: 'stamina',
  nav_gems: 'gems',
  nav_cosmetics: 'cosmetics',
};

interface ShopNavHitboxesProps {
  onNavigate: (page: ShopPage) => void;
}

export function ShopNavHitboxes({ onNavigate }: ShopNavHitboxesProps) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {SHOP_NAV_HITBOXES.map((box) => (
        <ShopHotspot
          key={box.id}
          box={box}
          zIndexBoost={50}
          onPress={() => onNavigate(NAV_PAGE[box.id as keyof typeof NAV_PAGE])}
        />
      ))}
    </View>
  );
}
