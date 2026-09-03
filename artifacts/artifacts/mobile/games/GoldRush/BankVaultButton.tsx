import React from 'react';
import { WorldButton } from '@/games/visualFoundation';
import { GoldTone } from './goldTokens';

export function BankVaultButton({
  onPress,
  label = 'Cash Out',
  colors = [GoldTone.metalHot, GoldTone.metal],
}: {
  onPress: () => void;
  label?: string;
  colors?: [string, string];
}) {
  return (
    <WorldButton
      label={label}
      onPress={onPress}
      colors={colors}
      textColor={GoldTone.void}
    />
  );
}
