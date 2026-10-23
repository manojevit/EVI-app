import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import StatusBadge from '@/components/status-badge';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { distanceKm, freeConnectorCount, type Station } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

/** Full-width station row for the Home list. */
export default function StationCard({ station }: { station: Station }) {
  const router = useRouter();
  const [fav, setFav] = useState(station.favourite);
  const free = freeConnectorCount(station);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/station/${station.id}`)} style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconChip}>
          <MaterialCommunityIcons name="ev-station" size={26} color={Palette.forest} />
          <View style={styles.cat}>
            <Text style={styles.catText}>{station.category}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{station.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{station.address}</Text>
        </View>

        <TouchableOpacity onPress={() => setFav((f) => !f)} hitSlop={10}>
          <Ionicons name={fav ? 'star' : 'star-outline'} size={22} color={fav ? Palette.volt : Palette.mistLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottom}>
        <StatusBadge label={`${free} free`} tone="available" />
        <View style={styles.metaRow}>
          <Ionicons name="navigate-outline" size={14} color={Palette.mist} />
          <Text style={styles.meta}>{distanceKm(station).toFixed(1)} km</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.price}>
          <Text style={styles.priceValue}>₹{station.pricePerKwh}</Text>
          <Text style={styles.priceUnit}>/kWh</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.soft,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: Radius.chip,
    backgroundColor: Palette.voltSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cat: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Palette.forest,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: Palette.surface,
  },
  catText: { fontFamily: Font.bold, fontSize: 9, color: Palette.white },
  name: { fontFamily: Font.displaySemi, fontSize: 18, color: Palette.ink },
  address: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, marginTop: 1 },

  bottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },
  price: { flexDirection: 'row', alignItems: 'baseline' },
  priceValue: { fontFamily: Font.display, fontSize: 20, color: Palette.forest },
  priceUnit: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },
});
