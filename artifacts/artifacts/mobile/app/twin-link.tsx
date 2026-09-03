import React from 'react';
import MemoryMatchScreen from '@/games/TwinLink/gamescreen';
import { useSevenGameRoute } from '@/games/sessionShell';

export default function TwinLinkRoute() {
  const { sessionId, screenProps } = useSevenGameRoute();
  return <MemoryMatchScreen key={sessionId} {...screenProps} />;
}
