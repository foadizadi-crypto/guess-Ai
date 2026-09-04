import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { GameColors } from '@/theme/colors';

/** Centered play column on web so tiles/popups don't stretch across a desktop window. */
export const PLAY_COLUMN_MAX = 430;
export const PLAY_COLUMN_WIDE_MAX = 680;

export const POPUP_WIDTH = '92%' as const;
export const POPUP_MAX_WIDTH = 420;
export const POPUP_FIXED_HEIGHT = 420;
export const POPUP_HEIGHT_RATIO = 0.78;
export const POPUP_PADDING = 22;
export const POPUP_RADIUS = 20;
export const POPUP_TITLE_SIZE = 22;
export const POPUP_TITLE_LINE = 28;
export const POPUP_BODY_SIZE = 16;
export const POPUP_BODY_LINE = 22;

export const TILE_GAP = 12;
export const TILE_TITLE_SIZE = 13;
export const TILE_TITLE_LINE = 16;
export const TILE_TITLE_LINES = 2;
export const TILE_PAD_H = 8;
export const TILE_PAD_V = 10;
export const GRID_WIDE_BREAKPOINT = 520;

export function playColumnMaxWidth(windowWidth: number): number {
  if (Platform.OS !== 'web') return windowWidth;
  return windowWidth >= 720 ? PLAY_COLUMN_WIDE_MAX : Math.min(PLAY_COLUMN_MAX, windowWidth);
}

export function categoryColumnCount(innerWidth: number): 2 | 3 {
  return innerWidth >= GRID_WIDE_BREAKPOINT ? 3 : 2;
}

export function categoryTileSize(innerWidth: number, columns: number, gap = TILE_GAP): number {
  if (innerWidth <= 0) return 0;
  return Math.floor((innerWidth - gap * (columns - 1)) / columns);
}

export function popupChromeHeight(windowHeight: number): number {
  return Math.min(POPUP_FIXED_HEIGHT, Math.round(windowHeight * POPUP_HEIGHT_RATIO));
}

export function usePopupChromeSize(): number {
  const { height } = useWindowDimensions();
  return popupChromeHeight(height);
}

export function PlayColumn({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  const maxWidth = playColumnMaxWidth(width);
  return (
    <View style={layoutStyles.playColumnOuter}>
      <View style={[layoutStyles.playColumnInner, { maxWidth }, style]}>{children}</View>
    </View>
  );
}

export const layoutStyles = StyleSheet.create({
  playColumnOuter: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  playColumnInner: {
    flex: 1,
    width: '100%',
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popupCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GameColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  popupCard: {
    width: POPUP_WIDTH,
    maxWidth: POPUP_MAX_WIDTH,
    padding: POPUP_PADDING,
    borderRadius: POPUP_RADIUS,
    alignItems: 'center',
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.cardBorder,
    gap: 12,
    overflow: 'hidden',
  },
  popupFrame: {
    width: POPUP_WIDTH,
    maxWidth: POPUP_MAX_WIDTH,
    overflow: 'hidden',
  },
  popupTitle: {
    fontSize: POPUP_TITLE_SIZE,
    lineHeight: POPUP_TITLE_LINE,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    color: GameColors.textWhite,
    width: '100%',
    flexShrink: 0,
  } as TextStyle,
  popupBody: {
    fontSize: POPUP_BODY_SIZE,
    lineHeight: POPUP_BODY_LINE,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    textAlign: 'center',
    color: GameColors.textSecondary,
    width: '100%',
  } as TextStyle,
  popupScroller: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    alignSelf: 'stretch',
  },
  popupScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 8,
  },
  tileTitle: {
    fontSize: TILE_TITLE_SIZE,
    lineHeight: TILE_TITLE_LINE,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  } as TextStyle,
});
