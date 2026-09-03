import React from 'react';
import PerfectClickScreen from '@/games/TickLock/gamescreen';
import { useSevenGameRoute } from '@/games/sessionShell';

export default function TickLockRoute() {
  const { sessionId, screenProps } = useSevenGameRoute();
  return <PerfectClickScreen key={sessionId} {...screenProps} />;
}
