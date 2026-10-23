import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import GoogleMapEmbed from '@/components/google-map-embed';
import { projectFromCenter } from '@/constants/map-style';
import { Palette } from '@/constants/theme';
import type { Station } from '@/data/mock';

/** White map-pin with a green charger icon (available) or grey (offline). */
export function ChargerPin({ available }: { available: boolean }) {
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

const PIN_H = 50;

/**
 * Station map built on Google's keyless embed, for Expo Go and the web build:
 * real Google tiles with tappable charger pins placed by coordinate.
 */
export default function EmbeddedStationMap({ stations }: { stations: Station[] }) {
  const router = useRouter();
  return (
    <View style={styles.map}>
      <GoogleMapEmbed />
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="box-none">
        {stations.map((s) => {
          const { x, y } = projectFromCenter(s.latitude, s.longitude);
          return (
            <Pressable
              key={s.id}
              onPress={() => router.push(`/station/${s.id}`)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={s.name}
              style={[styles.anchor, { transform: [{ translateX: x }, { translateY: y - PIN_H / 2 }] }]}>
              <ChargerPin available={s.status === 'Available'} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: '#E4EBE1' },
  center: { alignItems: 'center', justifyContent: 'center' },
  anchor: { position: 'absolute', width: 50, height: PIN_H, alignItems: 'center', justifyContent: 'flex-end' },

  pinWrap: { alignItems: 'center' },
  glow: { position: 'absolute', top: 2, width: 46, height: 46, borderRadius: 23, backgroundColor: Palette.volt, opacity: 0.25 },
  pin: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.white, borderWidth: 3, borderColor: Palette.volt, alignItems: 'center', justifyContent: 'center' },
  pinOff: { borderColor: Palette.mistLight },
  stem: { width: 3, height: 10, marginTop: -2, backgroundColor: Palette.volt, borderRadius: 2 },
  stemOff: { backgroundColor: Palette.mistLight },
});
