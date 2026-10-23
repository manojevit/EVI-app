import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MAP_STYLE } from '@/constants/map-style';
import { Font, Palette } from '@/constants/theme';
import type { Station } from '@/data/mock';

const DELHI_REGION = { latitude: 28.62, longitude: 77.17, latitudeDelta: 0.9, longitudeDelta: 0.9 };

// react-native-maps is a native module not present in Expo Go — load it only
// outside Expo Go so the app runs in Expo Go (with a placeholder) and shows the
// real Google map in a dev build / APK.
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


/** White map-pin with a green charger icon (available) or grey (offline). */
function ChargerPin({ available }: { available: boolean }) {
  return (
    <View style={styles.pinWrap}>
      {available ? <View style={styles.glow} /> : null}
      <View style={[styles.pin, !available && styles.pinOff]}>
        <MaterialCommunityIcons name="ev-station" size={22} color={available ? Palette.forest : Palette.mistLight} />
      </View>
      <View style={[styles.stem, !available && styles.stemOff]} />
    </View>
  );
}

function FallbackMap({ stations }: { stations: Station[] }) {
  return (
    <View style={styles.fallback}>
      <View style={styles.fbPins}>
        {stations.slice(0, 5).map((s) => (
          <ChargerPin key={s.id} available={s.status === 'Available'} />
        ))}
      </View>
      <Text style={styles.fbText}>Live Google map appears in the app build</Text>
    </View>
  );
}

export default function StationMap({ stations }: { stations: Station[] }) {
  const router = useRouter();
  if (!Maps) return <FallbackMap stations={stations} />;

  const MapView = Maps.default;
  const { Marker, PROVIDER_GOOGLE } = Maps;

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={DELHI_REGION}
      customMapStyle={MAP_STYLE}
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
  fallback: { flex: 1, backgroundColor: '#DCE7D8', alignItems: 'center', justifyContent: 'center', gap: 24 },
  fbPins: { flexDirection: 'row', gap: 18, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 40 },
  fbText: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist },

  pinWrap: { alignItems: 'center' },
  glow: { position: 'absolute', top: 2, width: 46, height: 46, borderRadius: 23, backgroundColor: Palette.volt, opacity: 0.25 },
  pin: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.white, borderWidth: 3, borderColor: Palette.volt, alignItems: 'center', justifyContent: 'center' },
  pinOff: { borderColor: Palette.mistLight },
  stem: { width: 3, height: 10, marginTop: -2, backgroundColor: Palette.volt, borderRadius: 2 },
  stemOff: { backgroundColor: Palette.mistLight },
});
