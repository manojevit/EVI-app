/**
 * EVIT design system — "Daylight Volt" (light).
 *
 * Built on the logo green #20944C. Colour roles:
 *  - Neutrals (green-biased off-whites + charcoal ink) carry ~90% of every screen.
 *  - Brand green is the ONE accent: primary actions, active states, key numbers.
 *  - A deeper green is used for green text/icons so they pass contrast on white.
 *  - Amber is the single warm complement, reserved for meaning ("in use / occupied").
 *  - Red only for errors / stop. Lime only on the dark login hero.
 */

export const Palette = {
  // Neutrals
  canvas: '#F5F7F4',
  canvasDeep: '#EBEFE9',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9F6',

  ink: '#13201A',
  inkSoft: '#37443D',
  mist: '#5D6B63', // secondary text (≥ 5:1 on white)
  mistLight: '#99A49D', // placeholders / disabled

  // Brand
  volt: '#20944C', // logo green — fills, progress, active dots
  emerald: '#20944C',
  forest: '#17713A', // green for text & icons on light (≈ 6:1 on white)
  forestDeep: '#105A2D',
  voltSoft: '#E8F4EC', // tinted fills, chips
  voltSofter: '#F2F9F4',
  brandTint2: '#D3EADB', // tinted borders

  // Warm complement — meaning only: in use / occupied / attention
  amber: '#D98A1F',
  amberDeep: '#9A5A0E', // amber text on light
  amberSoft: '#FBEFD9',

  // Error / stop
  red: '#D2453A',
  redSoft: '#FBE7E5',

  // Login hero only
  nocturne: '#12271D',
  nocturneSoft: '#1B3528',
  lime: '#C9F24A',
  limeDeep: '#A6D62E',

  // Lines & utility
  line: '#E3E8E1',
  lineSoft: '#EEF1EC',
  white: '#FFFFFF',
  black: '#000000',

  // Gradients
  gradForest: ['#25A257', '#17713A'] as const, // primary buttons
  gradVolt: ['#2CAF60', '#20944C'] as const,
  gradEnergy: ['#8ED9A6', '#20944C'] as const, // charge ring
  gradHero: ['#E6F4EB', '#FFFFFF'] as const, // light hero cards
  gradNocturne: ['#1C3A2A', '#0E2017'] as const,
  gradDarkHero: ['#123123', '#071209'] as const, // login hero
} as const;

export const Font = {
  display: 'Sora_800ExtraBold',
  displaySemi: 'Sora_700Bold',
  displayMed: 'Sora_600SemiBold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 44,
} as const;

export const Radius = {
  chip: 12,
  card: 22,
  hero: 28,
  pill: 999,
} as const;

export const Shadow = {
  lift: {
    shadowColor: '#1A3B28',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 5,
  },
  soft: {
    shadowColor: '#1A3B28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  volt: {
    shadowColor: '#20944C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const Colors = {
  light: { text: Palette.ink, background: Palette.canvas, tint: Palette.volt },
  dark: { text: Palette.ink, background: Palette.canvas, tint: Palette.volt },
} as const;

export type ThemeColor = string;
