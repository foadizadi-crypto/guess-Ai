/**
 * Semantic color tokens for the game.
 *
 * Both light and dark use the game's dark palette — this is a dark-only app.
 * The useColors() hook reads `dark` when the device is in dark mode (which is
 * the only mode we support). Setting userInterfaceStyle: "dark" in app.json
 * ensures the device is always in dark mode within the app.
 */

const colors = {
  light: {
    text: '#FFFFFF',
    tint: '#FFD700',
    background: '#0D0221',
    foreground: '#FFFFFF',
    card: '#1E1E2E',
    cardForeground: '#FFFFFF',
    primary: '#FFD700',
    primaryForeground: '#0D0221',
    secondary: '#1A0B2E',
    secondaryForeground: '#FFFFFF',
    muted: '#1E1E2E',
    mutedForeground: '#B0B0B0',
    accent: '#FF6B35',
    accentForeground: '#FFFFFF',
    destructive: '#FF1744',
    destructiveForeground: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
    input: 'rgba(255, 255, 255, 0.1)',
  },
  dark: {
    text: '#FFFFFF',
    tint: '#FFD700',
    background: '#0D0221',
    foreground: '#FFFFFF',
    card: '#1E1E2E',
    cardForeground: '#FFFFFF',
    primary: '#FFD700',
    primaryForeground: '#0D0221',
    secondary: '#1A0B2E',
    secondaryForeground: '#FFFFFF',
    muted: '#1E1E2E',
    mutedForeground: '#B0B0B0',
    accent: '#FF6B35',
    accentForeground: '#FFFFFF',
    destructive: '#FF1744',
    destructiveForeground: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
    input: 'rgba(255, 255, 255, 0.1)',
  },
  radius: 12,
};

export default colors;
