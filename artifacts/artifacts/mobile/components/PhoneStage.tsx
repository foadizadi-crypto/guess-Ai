import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';

const PHONE_ASPECT = 9 / 19.5;

interface PhoneStageProps {
  children: React.ReactNode;
}

/**
 * On web the lobby (and other phone-art screens) are a portrait hitbox overlay.
 * Stretching them to a desktop viewport misaligns every tap target, so Play
 * looks tappable on the artwork but the real hitbox is somewhere else.
 * Native builds already run full-screen portrait, so this is a no-op there.
 */
export function PhoneStage({ children }: PhoneStageProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  const stage = useMemo(() => {
    if (box.width <= 0 || box.height <= 0) {
      return { width: '100%' as const, height: '100%' as const };
    }
    const byHeight = box.height * PHONE_ASPECT;
    if (byHeight <= box.width) {
      return { width: byHeight, height: box.height };
    }
    return { width: box.width, height: box.width / PHONE_ASPECT };
  }, [box.height, box.width]);

  if (Platform.OS !== 'web') {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <View style={styles.shell} onLayout={onLayout}>
      <View style={[styles.phone, stage]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#02000A',
  },
  phone: {
    overflow: 'hidden',
    backgroundColor: '#02000A',
  },
});
