import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { GameColors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useRTL } from '@/hooks/useRTL';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
}) => {
  const { textAlign } = useRTL();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={GameColors.accentGold} />
        {!!message && (
          <Text style={[styles.message, { textAlign }]}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GameColors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: GameColors.card,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: GameColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  message: {
    ...Typography.caption,
    color: GameColors.textSecondary,
    marginTop: 4,
  },
});
