import { Image } from 'expo-image';

// The official EVIT logo (transparent PNG, trimmed). Aspect ≈ 229:163.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require('@/assets/images/logo-mark.png');
const RATIO = 229 / 163;

/** Real EVIT logo in brand green — for light UI (headers). */
export default function BrandLogo({ height = 44 }: { height?: number }) {
  return <Image source={LOGO} style={{ width: height * RATIO, height }} contentFit="contain" />;
}

/** Real EVIT logo tinted white — for dark surfaces (login hero). */
export function BrandLogoImage({ height = 96 }: { height?: number }) {
  return <Image source={LOGO} style={{ width: height * RATIO, height }} contentFit="contain" tintColor="#FFFFFF" />;
}
