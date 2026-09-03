import React from 'react';
import { WorldButton } from '@/games/visualFoundation';
import { GoldTone } from './goldTokens';

export function BankVaultButton({ onPress }: { onPress: () => void }) {
  return (
    <WorldButton
      label="Bank score and go to next round"
      onPress={onPress}
      colors={[GoldTone.metalHot, GoldTone.metal]}
      textColor={GoldTone.void}
    />
  );
}
