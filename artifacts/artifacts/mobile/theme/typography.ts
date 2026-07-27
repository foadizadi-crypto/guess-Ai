import { TextStyle } from 'react-native';

// ─── Typography scale ──────────────────────────────────────────────────────
// Use these in StyleSheet.create(). They match the spec exactly.

export const Typography = {
  title: {
    fontSize: 48,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    lineHeight: 56,
  } as TextStyle,
  header: {
    fontSize: 36,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
  } as TextStyle,
  body: {
    fontSize: 24,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    lineHeight: 32,
  } as TextStyle,
  caption: {
    fontSize: 18,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  } as TextStyle,
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  } as TextStyle,
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    fontFamily: 'Inter_500Medium',
    lineHeight: 22,
  } as TextStyle,
  semibold: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 28,
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof Typography;
