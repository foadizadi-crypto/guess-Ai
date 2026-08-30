/**
 * Invisible percentage-based shop tap target.
 * Visual art stays on the background image; this view is layout-only.
 */
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
} from 'react-native';
import type { ShopHitbox } from '@/constants/shopHitboxes';
import { shopHitboxZIndex } from '@/constants/shopHitboxes';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface ShopHotspotProps {
  box: ShopHitbox;
  onPress: () => void;
  zIndexBoost?: number;
}

export function ShopHotspot({ box, onPress, zIndexBoost = 0 }: ShopHotspotProps) {
  const waveScale = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    waveScale.setValue(0.2);
    waveOpacity.setValue(0.45);
    Animated.parallel([
      Animated.timing(waveScale, {
        toValue: 1.4,
        duration: 380,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(waveOpacity, {
        toValue: 0,
        duration: 380,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  const handlePress = (_event: GestureResponderEvent) => {
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={box.label}
      onPressIn={handlePressIn}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(255,255,255,0.22)', foreground: true }}
      style={({ pressed }) => [
        styles.hitbox,
        {
          left: `${box.left}%`,
          top: `${box.top}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
          zIndex: shopHitboxZIndex(box) + zIndexBoost,
          backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'transparent',
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wave,
          {
            transform: [{ scale: waveScale }],
            opacity: waveOpacity,
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitbox: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 8,
  },
  wave: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
