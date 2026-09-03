import React from 'react';
import SimonSaysScreen from '@/games/NeonFlash/gamescreen';
import { useSevenGameRoute } from '@/games/sessionShell';

export default function NeonFlashRoute() {
  const { sessionId, screenProps } = useSevenGameRoute();
  return <SimonSaysScreen key={sessionId} {...screenProps} />;
}
