import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import EmbeddedStationMap, { ChargerPin } from '@/components/embedded-station-map';
import { useMapFallback } from '@/components/use-map-fallback';
import { MAP_STYLE } from '@/constants/map-style';
import type { Station } from '@/data/mock';

const DELHI_REGION = { latitude: 28.62, longitude: 77.17, latitudeDelta: 0.9, longitudeDelta: 0.9 };

// react-native-maps can't use our Maps key in Expo Go — load it only outside
// Expo Go. Expo Go shows the real Google map through the keyless embed instead,
// and the dev build / APK gets the native, styled, interactive map.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Maps: any = null;
if (!IS_EXPO_GO) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Maps = require('react-native-maps');
  } catch {
    Maps = null;
  }
}

export default function StationMap({ stations }: { stations: Station[] }) {
  const router = useRouter();
  const { failed, onMapLoaded } = useMapFallback();
  if (!Maps || failed) return <EmbeddedStationMap stations={stations} />;

  const MapView = Maps.default;
  const { Marker, PROVIDER_GOOGLE } = Maps;

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={DELHI_REGION}
      customMapStyle={MAP_STYLE}
      onMapLoaded={onMapLoaded}
      showsMyLocationButton={false}
      toolbarEnabled={false}>
      {stations.map((s: Station) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.latitude, longitude: s.longitude }}
          onPress={() => router.push(`/station/${s.id}`)}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}>
          <ChargerPin available={s.status === 'Available'} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
