/**
 * assets/icons — small inline SVG icons used across the app.
 * Pure react-native-svg, no image files needed.
 */
import React from 'react';
import { Svg, Circle, Text as SvgText } from 'react-native-svg';

interface IconProps {
  size?: number;
}

export function CoinIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill="#FFC93C" />
      <Circle cx="12" cy="12" r="8.5" fill="#FFB020" stroke="#E89B00" strokeWidth="1" />
      <SvgText
        x="12"
        y="16.5"
        fontSize="12"
        fontWeight="bold"
        fill="#8A5A00"
        textAnchor="middle"
      >
        $
      </SvgText>
    </Svg>
  );
}
