import React from 'react';
import StroopGameScreen from '@/games/ColorTrap/gamescreen';
import { useSevenGameRoute } from '@/games/sessionShell';

export default function ColorTrapRoute() {
  const { sessionId, screenProps } = useSevenGameRoute();
  return <StroopGameScreen key={sessionId} {...screenProps} />;
}
