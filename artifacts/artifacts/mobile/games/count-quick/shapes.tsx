import React from 'react';
import Svg, { Circle, Ellipse, Polygon, Rect } from 'react-native-svg';
import type { CountQuickShapeId } from './config';
import { chipTone } from './countTokens';

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
  const tone = chipTone(color);
  const c = size / 2;
  const r = size / 2 - 1.6;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Ellipse cx={c + 0.6} cy={c + 1.8} rx={r * 0.92} ry={r * 0.78} fill="rgba(4,10,16,0.42)" />
      <Circle cx={c} cy={c} r={r} fill={tone.deep} />
      <Circle cx={c} cy={c - 0.6} r={r - 1.1} fill={tone.fill} stroke={tone.rim} strokeWidth={1.4} />
      <Ellipse cx={c - r * 0.28} cy={c - r * 0.34} rx={r * 0.38} ry={r * 0.22} fill={tone.hot} opacity={0.55} />
      <Circle cx={c - r * 0.32} cy={c - r * 0.38} r={Math.max(2.2, r * 0.16)} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

function SquareShape({ color, size }: ShapeProps) {
  const tone = chipTone(color);
  const inset = 3;
  const body = size - inset * 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={inset + 1} y={inset + 2.4} width={body} height={body} rx={7} fill="rgba(4,10,16,0.4)" />
      <Rect x={inset} y={inset} width={body} height={body} rx={7} fill={tone.deep} />
      <Rect
        x={inset + 1}
        y={inset + 0.6}
        width={body - 2}
        height={body - 2.4}
        rx={6}
        fill={tone.fill}
        stroke={tone.rim}
        strokeWidth={1.4}
      />
      <Rect x={inset + 4} y={inset + 3} width={body * 0.42} height={body * 0.2} rx={3} fill={tone.hot} opacity={0.5} />
    </Svg>
  );
}

function TriangleShape({ color, size }: ShapeProps) {
  const tone = chipTone(color);
  const points = `${size / 2},3 ${size - 3},${size - 3} 3,${size - 3}`;
  const inner = `${size / 2},9 ${size - 8},${size - 8} 8,${size - 8}`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={`${size / 2},5 ${size - 2},${size - 1} 2,${size - 1}`} fill="rgba(4,10,16,0.4)" />
      <Polygon points={points} fill={tone.deep} />
      <Polygon points={inner} fill={tone.fill} stroke={tone.rim} strokeWidth={1.3} strokeLinejoin="round" />
      <Polygon
        points={`${size / 2},11 ${size / 2 + 7},20 ${size / 2 - 7},20`}
        fill={tone.hot}
        opacity={0.55}
      />
    </Svg>
  );
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? outer : inner;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
}

function StarShape({ color, size }: ShapeProps) {
  const tone = chipTone(color);
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={starPoints(cx + 0.6, cy + 1.6, outer, outer * 0.42)} fill="rgba(4,10,16,0.4)" />
      <Polygon points={starPoints(cx, cy, outer, outer * 0.42)} fill={tone.deep} />
      <Polygon
        points={starPoints(cx, cy - 0.4, outer - 1.4, (outer - 1.4) * 0.42)}
        fill={tone.fill}
        stroke={tone.rim}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Polygon points={starPoints(cx, cy - 1.2, outer * 0.42, outer * 0.18)} fill={tone.hot} opacity={0.5} />
    </Svg>
  );
}

function DiamondShape({ color, size }: ShapeProps) {
  const tone = chipTone(color);
  const c = size / 2;
  const points = `${c},3 ${size - 3},${c} ${c},${size - 3} 3,${c}`;
  const inner = `${c},8 ${size - 8},${c} ${c},${size - 8} 8,${c}`;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={`${c},5 ${size - 1},${c + 1} ${c},${size - 1} 1,${c + 1}`} fill="rgba(4,10,16,0.4)" />
      <Polygon points={points} fill={tone.deep} />
      <Polygon points={inner} fill={tone.fill} stroke={tone.rim} strokeWidth={1.3} strokeLinejoin="round" />
      <Polygon points={`${c},10 ${c + 6},${c - 2} ${c},16 ${c - 6},${c - 2}`} fill={tone.hot} opacity={0.5} />
    </Svg>
  );
}

function HexagonShape({ color, size }: ShapeProps) {
  const tone = chipTone(color);
  const cx = size / 2;
  const cy = size / 2;
  const hex = (r: number, ox = 0, oy = 0) =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i - 30);
      return `${cx + ox + r * Math.cos(angle)},${cy + oy + r * Math.sin(angle)}`;
    }).join(' ');
  const r = size / 2 - 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={hex(r, 0.5, 1.6)} fill="rgba(4,10,16,0.4)" />
      <Polygon points={hex(r)} fill={tone.deep} />
      <Polygon points={hex(r - 1.4, 0, -0.4)} fill={tone.fill} stroke={tone.rim} strokeWidth={1.3} strokeLinejoin="round" />
      <Ellipse cx={cx - r * 0.22} cy={cy - r * 0.28} rx={r * 0.28} ry={r * 0.16} fill={tone.hot} opacity={0.5} />
    </Svg>
  );
}
