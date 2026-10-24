import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import ConnectorIcon from '@/components/connector-icon';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { toggleFavourite, useAppStore } from '@/data/app-store';
import {
  connectorTypesAt,
  directionsUrl,
  distanceKm,
  freeConnectorCount,
  isOpenNow,
  maxPowerKw,
  stationConnectors,
  stationExtras,
  type Station,
} from '@/data/mock';
import { stationPhotos } from '@/data/station-photos';

/**
 * Station card for the list view: photo first, then what matters at a glance —
 * how many plugs are free (and a live strip of every plug), speed, price and distance.
 */
export default function StationCard({ station, index = 0 }: { station: Station; index?: number }) {
  const router = useRouter();
  const fav = useAppStore((st) => st.favourites.includes(station.id));
  const free = freeConnectorCount(station);
  const total = stationConnectors(station).length;
  const open = isOpenNow(station);
  const { rating, reviewCount } = stationExtras(station);
  const dc = station.chargers.some((c) => c.current === 'DC' && c.online);
  const photo = stationPhotos(station.id)[0];

  // one segment per plug: free / in use / offline
  const plugs = station.chargers.flatMap((ch) =>
    ch.connectors.map((c) => (!ch.online ? 'off' : c.availability === 'Available' ? 'free' : c.availability === 'Charging' ? 'busy' : 'off')),
  );

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 70).duration(420)}>
      <TouchableOpacity activeOpacity={0.92} onPress={() => router.push(`/station/${station.id}`)} style={styles.card}>
        <View style={styles.photoWrap}>
          <Image source={photo.source} style={styles.photo} contentFit="cover" transition={200} />
          <LinearGradient colors={['rgba(8,24,15,0.05)', 'rgba(8,24,15,0.72)']} locations={[0.35, 1]} style={styles.shade} />

          <View style={styles.photoTop}>
            <View style={styles.availPill}>
              <View style={[styles.availDot, { backgroundColor: !open ? Palette.red : free ? Palette.volt : Palette.amber }]} />
              <Text style={styles.availText}>{!open ? 'Closed now' : free ? `${free} of ${total} free` : 'All busy'}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavourite(station.id)} hitSlop={10} style={styles.favBtn} accessibilityLabel="Save station">
              <Ionicons name={fav ? 'star' : 'star-outline'} size={18} color={fav ? Palette.amber : Palette.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.photoBottom}>
            <View style={[styles.speed, dc && styles.speedDc]}>
              <Ionicons name="flash" size={13} color={dc ? Palette.ink : Palette.white} />
              <Text style={[styles.speedText, dc && { color: Palette.ink }]}>
                {maxPowerKw(station)} kW {dc ? 'DC fast' : 'AC'}
              </Text>
            </View>
            <View style={styles.rating}>
              <Ionicons name="star" size={13} color="#FFC94D" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({reviewCount})</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {station.name}
              </Text>
              <Text style={styles.address} numberOfLines={1}>
                {station.address}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.price}>₹{station.pricePerKwh}</Text>
              <Text style={styles.priceUnit}>per kWh</Text>
            </View>
          </View>

          {/* live plug strip */}
          <View style={styles.strip}>
            {plugs.map((p, i) => (
              <View key={i} style={[styles.seg, p === 'free' ? styles.segFree : p === 'busy' ? styles.segBusy : styles.segOff]} />
            ))}
          </View>

          <View style={styles.bottom}>
            <View style={styles.types}>
              {connectorTypesAt(station)
                .slice(0, 4)
                .map((k) => (
                  <View key={k} style={styles.typeIcon}>
                    <ConnectorIcon type={k} size={18} />
                  </View>
                ))}
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.nav} activeOpacity={0.85} onPress={() => Linking.openURL(directionsUrl(station))} accessibilityLabel="Navigate">
              <Ionicons name="navigate" size={15} color={Palette.white} />
              <Text style={styles.navText}>{distanceKm(station).toFixed(1)} km</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = scaledSheet({
  card: { backgroundColor: Palette.surface, borderRadius: Radius.hero, overflow: 'hidden', ...Shadow.lift },

  photoWrap: { height: 150, backgroundColor: Palette.canvasDeep },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  photoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
  availPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontFamily: Font.bold, fontSize: 12, color: Palette.ink },
  favBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(10,25,17,0.42)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  photoBottom: { position: 'absolute', left: Spacing.md, right: Spacing.md, bottom: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  speed: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  speedDc: { backgroundColor: '#C9F24A' },
  speedText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: Font.bold, fontSize: 13, color: Palette.white },
  ratingCount: { fontFamily: Font.medium, fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  body: { padding: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  name: { fontFamily: Font.displaySemi, fontSize: 17, color: Palette.ink },
  address: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },
  priceBox: { alignItems: 'flex-end' },
  price: { fontFamily: Font.display, fontSize: 18, color: Palette.forest },
  priceUnit: { fontFamily: Font.medium, fontSize: 11, color: Palette.mist, marginTop: -1 },

  strip: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  segFree: { backgroundColor: Palette.volt },
  segBusy: { backgroundColor: Palette.amber },
  segOff: { backgroundColor: Palette.line },

  bottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  types: { flexDirection: 'row', gap: 5 },
  typeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.voltSofter, borderWidth: 1, borderColor: Palette.brandTint2, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 9, ...Shadow.volt },
  navText: { fontFamily: Font.bold, fontSize: 13, color: Palette.white },
});
