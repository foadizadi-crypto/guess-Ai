export const CountTone = {
  void: '#061018',
  velvet: '#0B1C28',
  well: '#07141E',
  ink: '#F4FBFF',
  mute: 'rgba(244,251,255,0.62)',
  tally: '#2DD4BF',
  tallyHot: '#99F6E4',
  tallyDeep: '#0F766E',
  flash: '#FB7185',
  flashHot: '#FECDD3',
  flashDeep: '#9F1239',
  amber: '#FBBF24',
  amberHot: '#FDE68A',
  amberDeep: '#92400E',
  green: '#34D399',
  greenHot: '#6EE7B7',
  greenDeep: '#065F46',
  red: '#F43F5E',
  redHot: '#FB7185',
  redDeep: '#881337',
} as const;

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  return [
    Number.parseInt(full.slice(0, 2), 16) || 0,
    Number.parseInt(full.slice(2, 4), 16) || 0,
    Number.parseInt(full.slice(4, 6), 16) || 0,
  ];
}

export function mixHex(hex: string, toward: string, t: number): string {
  const a = parseHex(hex);
  const b = parseHex(toward);
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const to = (n: number) => n.toString(16).padStart(2, '0');
  const m = (i: number) => clamp(a[i] + (b[i] - a[i]) * t);
  return `#${to(m(0))}${to(m(1))}${to(m(2))}`;
}

export function chipTone(hex: string) {
  return {
    fill: hex,
    hot: mixHex(hex, '#FFFFFF', 0.42),
    deep: mixHex(hex, '#041018', 0.42),
    rim: mixHex(hex, '#041018', 0.58),
  };
}
