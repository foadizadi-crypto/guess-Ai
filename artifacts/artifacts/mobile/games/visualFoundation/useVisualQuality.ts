import { useMemo } from 'react';
import { PixelRatio, useWindowDimensions } from 'react-native';
import type { VisualQuality } from './quality';

export function useVisualQuality(): VisualQuality {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const pr = PixelRatio.get();
    const shortest = Math.min(width, height);
    if (shortest < 340 || pr < 2) return 'low';
    if (pr < 2.7 || shortest < 390) return 'medium';
    return 'high';
  }, [width, height]);
}
