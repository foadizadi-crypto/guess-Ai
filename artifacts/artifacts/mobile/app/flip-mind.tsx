import React from 'react';
import ReverseReactionScreen from '@/games/FlipMind/gamescreen';
import { useSevenGameRoute } from '@/games/sessionShell';

export default function FlipMindRoute() {
  const { sessionId, screenProps } = useSevenGameRoute();
  return <ReverseReactionScreen key={sessionId} {...screenProps} />;
}
