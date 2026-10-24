import { Dimensions, PixelRatio, StyleSheet, useWindowDimensions } from 'react-native';

/**
 * Responsive sizing.
 *
 * Screens were designed on a 390pt-wide phone. On narrower phones (or with Android
 * "Display size" turned up) everything looked oversized, so layout sizes scale with
 * the screen width, and text scales a little more gently. The system font-size
 * setting is still honoured, but capped so huge text can't break layouts.
 */
const BASE_WIDTH = 390;
const MAX_FONT_MULTIPLIER = 1.15;
/**
 * Widest the app gets. On tablets (and wide browser windows) the app sits in a centred
 * column this wide instead of stretching cards and text across the whole screen.
 */
export const APP_MAX_WIDTH = 520;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const { width } = Dimensions.get('window');
const fontScale = PixelRatio.getFontScale();

/** Layout scale: 0.82× on very small phones up to 1.08× on large ones. */
export const LAYOUT_SCALE = clamp(Math.min(width, APP_MAX_WIDTH) / BASE_WIDTH, 0.82, 1.08);

/** The app's own size: the window, but never wider than APP_MAX_WIDTH. */
export function useAppWidth() {
  const { width: w, height } = useWindowDimensions();
  return { width: Math.min(w, APP_MAX_WIDTH), height };
}

/** Text scale: moves 80% as far as the layout, and cancels font scaling above the cap. */
export const TEXT_SCALE = (1 + (LAYOUT_SCALE - 1) * 0.8) * (fontScale > MAX_FONT_MULTIPLIER ? MAX_FONT_MULTIPLIER / fontScale : 1);

const half = (n: number) => Math.round(n * 2) / 2;

/** Scale a layout size (padding, width, radius…). */
export const s = (n: number) => half(n * LAYOUT_SCALE);
/** Scale a font size or line height. */
export const fs = (n: number) => half(n * TEXT_SCALE);

const TEXT_KEYS = new Set(['fontSize', 'lineHeight']);
const LAYOUT_KEYS = new Set([
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingHorizontal', 'paddingVertical',
  'paddingStart', 'paddingEnd',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'marginStart', 'marginEnd',
  'gap', 'rowGap', 'columnGap',
  'top', 'bottom', 'left', 'right',
  'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
]);

// The style-map type StyleSheet.create accepts (same signature, so style literals keep their exact types).
type Styles = Parameters<typeof StyleSheet.create>[0];

/**
 * Drop-in for StyleSheet.create that scales numeric sizes for the current screen.
 * Percentages, colours, flex, borders, shadows and transforms are left alone.
 */
export function scaledSheet<S extends Styles>(styles: S & Styles): Readonly<S> {
  const out: Record<string, object> = {};
  for (const [name, style] of Object.entries(styles) as [string, Record<string, unknown>][]) {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(style)) {
      if (typeof value !== 'number') next[key] = value;
      else if (TEXT_KEYS.has(key)) next[key] = fs(value);
      else if (key === 'letterSpacing') next[key] = value * TEXT_SCALE;
      else if (LAYOUT_KEYS.has(key) && value !== 999) next[key] = s(value); // 999 = pill radius
      else next[key] = value;
    }
    out[name] = next;
  }
  return StyleSheet.create(out) as unknown as Readonly<S>;
}
