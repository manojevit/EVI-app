import { Image } from 'expo-image';

import { Palette } from '@/constants/theme';
import { CONNECTORS, type ConnectorKey } from '@/data/connectors';

/** Official connector line icon, tinted to the theme (grey when unavailable). */
export default function ConnectorIcon({
  type,
  size = 28,
  muted,
  color,
}: {
  type: ConnectorKey;
  size?: number;
  muted?: boolean;
  color?: string;
}) {
  return (
    <Image
      source={CONNECTORS[type].icon}
      style={{ width: size, height: size }}
      contentFit="contain"
      tintColor={color ?? (muted ? Palette.mistLight : Palette.forest)}
    />
  );
}
