import { Image } from 'expo-image';

// The official EVIT logo (assets/images/EVIT_R_Logo.png), cut into app sizes by the
// logo script: the full lockup with the tagline, and the mark without it.
/* eslint-disable @typescript-eslint/no-require-imports */
const MARK = require('@/assets/images/logo-mark.png');
const FULL = require('@/assets/images/logo-full.png');
/* eslint-enable @typescript-eslint/no-require-imports */
const MARK_RATIO = 900 / 537;
const FULL_RATIO = 1200 / 803;

/** EVIT logo (E⚡VI Technologies) in brand green — headers and light UI. */
export default function BrandLogo({ height = 44 }: { height?: number }) {
  return <Image source={MARK} style={{ width: height * MARK_RATIO, height }} contentFit="contain" />;
}

/** Full logo with "…converting electrons into fuel" — splash, onboarding, sign-in. */
export function BrandLogoFull({ height = 80 }: { height?: number }) {
  return <Image source={FULL} style={{ width: height * FULL_RATIO, height }} contentFit="contain" />;
}

/** EVIT logo tinted white — for dark surfaces. */
export function BrandLogoImage({ height = 96 }: { height?: number }) {
  return <Image source={MARK} style={{ width: height * MARK_RATIO, height }} contentFit="contain" tintColor="#FFFFFF" />;
}
