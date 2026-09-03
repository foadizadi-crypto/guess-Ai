import React from 'react';
import SpotDifferenceScreen from '@/games/GlitchSpy/gamescreen';
import { useSevenGameRoute } from '@/games/sessionShell';

export default function GlitchSpyRoute() {
  const { sessionId, screenProps } = useSevenGameRoute();
  return <SpotDifferenceScreen key={sessionId} {...screenProps} />;
}
