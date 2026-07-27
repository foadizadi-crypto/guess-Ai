// ─── Game color palette — single source of truth ──────────────────────────
// All game-specific named colors. Never hardcode hex values in components;
// import from here or use useColors() for semantic tokens.

export const GameColors = {
  // Backgrounds
  backgroundPrimary: '#0D0221',
  backgroundSecondary: '#1A0B2E',

  // Accents
  accentGold: '#FFD700',
  accentRed: '#FF1744',
  accentGreen: '#00E676',
  accentOrange: '#FF6B35',

  // Text
  textWhite: '#FFFFFF',
  textSecondary: '#B0B0B0',

  // Surfaces
  card: '#1E1E2E',

  // Glow / overlay
  glow: 'rgba(255, 215, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  border: 'rgba(255, 255, 255, 0.1)',
  cardBorder: 'rgba(255, 215, 0, 0.15)',

  // Coin pill
  coinBg: 'rgba(255, 215, 0, 0.15)',
  coinBorder: 'rgba(255, 215, 0, 0.3)',

  // Difficulty
  easy: '#00E676',
  medium: '#FFD700',
  hard: '#FF1744',

  // Utility
  transparent: 'transparent',
} as const;

export type GameColorKey = keyof typeof GameColors;
