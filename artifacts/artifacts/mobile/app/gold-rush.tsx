import React from 'react';
import FateGameScreen from '@/games/GoldRush/gamescreen';
import { useSevenGameRoute } from '@/games/sessionShell';

export default function GoldRushRoute() {
  const { sessionId, screenProps } = useSevenGameRoute();
  return <FateGameScreen key={sessionId} {...screenProps} />;
}
