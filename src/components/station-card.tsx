import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';

import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { directionsUrl, distanceKm, freeConnectorCount, isOpenNow, maxPowerKw, stationConnectors, type Station } from '@/data/mock';
import { stationPhotos } from '@/data/station-photos';

/**
 * One station, simply: photo, name, whether a plug is free, speed, price, and
 * one-tap directions. Used for the list, and (compact) for the swipe cards on the map.
 */
export default function StationCard({
  station,
  selected,
  compact,
  style,
}: {
  station: Station;
  selected?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}) {
  const router = useRouter();
  const from = useAppStore((st) => st.location);
  const free = freeConnectorCount(station);
  const total = stationConnectors(station).length;
  const open = isOpenNow(station);
  const dc = station.chargers.some((c) => c.current === 'DC' && c.online);
  const photo = stationPhotos(station.id)[0];
  const km = distanceKm(station, from);

  const tone = !open ? Palette.red : free ? Palette.forest : Palette.amberDeep;
  const status = !open ? 'Closed now' : free ? `${free} of ${total} free` : 'All in use';
  const kmText = `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  const directions = () => Linking.openURL(directionsUrl(station));

  if (compact) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/station/${station.id}`)} style={[styles.mini, selected && styles.cardSelected, style]}>
        <Image source={photo.source} style={styles.miniThumb} contentFit="cover" transition={150} />
        <View style={styles.info}>
          <Text style={styles.miniName} numberOfLines={1}>
            {station.name}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: !open ? Palette.red : free ? Palette.volt : Palette.amber }]} />
            {/* free count always shows in full; the kW gives way on narrow phones */}
            <Text style={[styles.status, { color: tone, flexShrink: 0 }]} numberOfLines={1}>
              {status}
            </Text>
            <Text style={styles.sep}>·</Text>
            <Text style={[styles.speed, { flexShrink: 1 }]} numberOfLines={1}>
              {maxPowerKw(station)} kW {dc ? 'DC' : 'AC'}
            </Text>
          </View>
          <Text style={styles.miniMeta} numberOfLines={1}>
            <Text style={styles.miniPrice}>₹{station.pricePerKwh}</Text>/kWh · {kmText}
          </Text>
        </View>
        <TouchableOpacity style={styles.miniNav} activeOpacity={0.85} onPress={directions} accessibilityLabel={`Directions, ${kmText}`}>
          <Ionicons name="navigate" size={17} color={Palette.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/station/${station.id}`)} style={[styles.card, selected && styles.cardSelected, style]}>
      <Image source={photo.source} style={styles.thumb} contentFit="cover" transition={150} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {station.name}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          {station.address}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: !open ? Palette.red : free ? Palette.volt : Palette.amber }]} />
          <Text style={[styles.status, { color: tone }]} numberOfLines={1}>
            {status}
          </Text>
          <Text style={styles.sep}>·</Text>
          <Ionicons name="flash" size={12} color={Palette.mist} />
          <Text style={styles.speed} numberOfLines={1}>
            {maxPowerKw(station)} kW {dc ? 'DC' : 'AC'}
          </Text>
        </View>
        <View style={styles.bottom}>
          <Text style={styles.price}>
            ₹{station.pricePerKwh}
            <Text style={styles.priceUnit}> /kWh</Text>
          </Text>
          <TouchableOpacity style={styles.nav} activeOpacity={0.85} onPress={directions} accessibilityLabel={`Directions, ${kmText}`}>
            <Ionicons name="navigate" size={13} color={Palette.white} />
            <Text style={styles.navText}>{kmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    padding: Spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadow.soft,
  },
  cardSelected: { borderColor: Palette.volt },
  thumb: { width: 92, alignSelf: 'stretch', minHeight: 92, borderRadius: 16, backgroundColor: Palette.canvasDeep },
  info: { flex: 1, minWidth: 0, gap: 3, paddingVertical: 2, paddingRight: 2 },
  name: { fontFamily: Font.displaySemi, fontSize: 15, color: Palette.ink },
  address: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  status: { fontFamily: Font.semibold, fontSize: 12, flexShrink: 1 },
  sep: { fontFamily: Font.bold, fontSize: 12, color: Palette.mistLight, marginHorizontal: 1 },
  speed: { fontFamily: Font.medium, fontSize: 12, color: Palette.inkSoft, flexShrink: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontFamily: Font.display, fontSize: 15, color: Palette.ink },
  priceUnit: { fontFamily: Font.medium, fontSize: 11, color: Palette.mist },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: 11, paddingVertical: 6 },
  navText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },

  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: 20,
    padding: 8,
    paddingRight: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadow.lift,
  },
  miniThumb: { width: 58, height: 58, borderRadius: 14, backgroundColor: Palette.canvasDeep },
  miniName: { fontFamily: Font.displaySemi, fontSize: 14, color: Palette.ink },
  miniMeta: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  miniPrice: { fontFamily: Font.bold, color: Palette.ink },
  miniNav: { width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
});
