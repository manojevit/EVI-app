import EmbeddedStationMap from '@/components/embedded-station-map';
import type { Station } from '@/data/mock';

/**
 * Web build: a real Google map (keyless embed) with tappable charger pins. On
 * device, station-map.tsx renders react-native-maps with the custom style.
 */
export default function StationMap({ stations }: { stations: Station[] }) {
  return <EmbeddedStationMap stations={stations} />;
}
