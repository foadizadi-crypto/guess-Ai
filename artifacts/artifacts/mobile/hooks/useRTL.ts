import { TextStyle, ViewStyle } from 'react-native';
import { useUserStore } from '@/store/userStore';

// ─── RTL support for Persian / Arabic ────────────────────────────────────
// Every text-rendering component must consume this hook.

export interface RTLHelpers {
  isRTL: boolean;
  textAlign: TextStyle['textAlign'];
  flexDirection: ViewStyle['flexDirection'];
  writingDirection: 'ltr' | 'rtl';
}

export const useRTL = (): RTLHelpers => {
  const language = useUserStore((state) => state.settings.language);
  const isRTL = language === 'fa';

  return {
    isRTL,
    textAlign: isRTL ? 'right' : 'left',
    flexDirection: isRTL ? 'row-reverse' : 'row',
    writingDirection: isRTL ? 'rtl' : 'ltr',
  };
};
