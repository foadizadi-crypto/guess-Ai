import React from 'react';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import type { CountQuickShapeId } from './config';

interface ShapeProps {
  color: string;
  size: number;
}

export function CountQuickShape({ shape, color, size }: ShapeProps & { shape: CountQuickShapeId }) {
  switch (shape) {
    case 'circle':
      return <CircleShape color={color} size={size} />;
    case 'square':
      return <SquareShape color={color} size={size} />;
    case 'triangle':
      return <TriangleShape color={color} size={size} />;
    case 'star':
      return <StarShape color={color} size={size} />;
    case 'diamond':
      return <DiamondShape color={color} size={size} />;
    case 'hexagon':
      return <HexagonShape color={color} size={size} />;
  }
}

function CircleShape({ color, size }: ShapeProps) {
  const r = size / 2 - 1;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill={color} />
    </Svg>
  );
}

function SquareShape({ color, size }: ShapeProps) {
  const inset = 3;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={inset} y={inset} width={size - inset * 2} height={size - inset * 2} rx={6} fill={color} />
    </Svg>
  );
}

function TriangleShape({ color, size }: ShapeProps) {
  const points = `${size / 2},3 ${size - 3},${size - 3} 3,${size - 3}`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={points} fill={color} />
    </Svg>
  );
}

function StarShape({ color, size }: ShapeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 2;
  const inner = outer * 0.42;
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={points} fill={color} />
    </Svg>
  );
}

function DiamondShape({ color, size }: ShapeProps) {
  const c = size / 2;
  const points = `${c},3 ${size - 3},${c} ${c},${size - 3} 3,${c}`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={points} fill={color} />
    </Svg>
  );
}

function HexagonShape({ color, size }: ShapeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={points} fill={color} />
    </Svg>
  );
}
