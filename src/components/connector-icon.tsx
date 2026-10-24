import { Image } from 'expo-image';

import { Palette } from '@/constants/theme';
import { CONNECTORS, type ConnectorKey } from '@/data/connectors';

/**
 * Official connector icon (from EV_Connector_Data). Tinted to the theme by default
 * (grey when unavailable); `original` keeps the supplied navy artwork as it is.
 */
export default function ConnectorIcon({
  type,
  size = 28,
  muted,
  color,
  original,
}: {
  type: ConnectorKey;
  size?: number;
  muted?: boolean;
  color?: string;
  original?: boolean;
}) {
  return (
    <Image
      source={CONNECTORS[type].icon}
      style={{ width: size, height: size, opacity: original && muted ? 0.35 : 1 }}
      contentFit="contain"
      tintColor={original ? undefined : (color ?? (muted ? Palette.mistLight : Palette.forest))}
    />
  );
}
