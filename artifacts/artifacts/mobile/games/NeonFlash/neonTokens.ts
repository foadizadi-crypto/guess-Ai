export const FlashTone = {
  void: '#04010C',
  pit: '#0B0418',
  magenta: '#FF2BD6',
  magentaHot: '#FF86EE',
  magentaDeep: '#6B0860',
  cyan: '#22F0FF',
  cyanHot: '#B8FFFF',
  cyanDeep: '#075560',
  metal: '#C4B5FD',
  metalHot: '#F3E8FF',
  metalDeep: '#2A0B5C',
  ink: '#F7F4FF',
  mute: 'rgba(247,244,255,0.62)',
  watch: '#FFE08A',
  play: '#5EF2C2',
} as const;

export function hexAlpha(hex: string, a: number): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
