import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

import ConnectorIcon from '@/components/connector-icon';
import { scaledSheet } from '@/constants/responsive';
import { toggleFavourite, useAppStore } from '@/data/app-store';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
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

/** Station row for the list view: the essentials at a glance, plus one-tap Navigate. */
export default function StationCard({ station }: { station: Station }) {
  const router = useRouter();
  const fav = useAppStore((st) => st.favourites.includes(station.id));
  const free = freeConnectorCount(station);
  const total = stationConnectors(station).length;
  const open = isOpenNow(station);
  const { rating } = stationExtras(station);
  const dc = station.chargers.some((c) => c.current === 'DC' && c.online);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/station/${station.id}`)} style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.badge, dc && styles.badgeDc]}>
          <Ionicons name="flash" size={14} color={dc ? Palette.white : Palette.forest} />
          <Text style={[styles.badgeText, dc && { color: Palette.white }]}>{dc ? 'DC' : 'AC'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {station.name}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {station.address}
          </Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavourite(station.id)} hitSlop={10} accessibilityLabel="Save station">
          <Ionicons name={fav ? 'star' : 'star-outline'} size={20} color={fav ? Palette.amber : Palette.mistLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.facts}>
        <Fact
          dot={free ? Palette.volt : Palette.amber}
          text={free ? `${free} of ${total} free` : 'All busy'}
          tone={free ? 'good' : 'warn'}
        />
        <Fact icon="flash-outline" text={`${maxPowerKw(station)} kW`} />
        <Fact icon="star" iconColor={Palette.amber} text={rating.toFixed(1)} />
        {!open ? <Fact text="Closed now" tone="bad" /> : null}
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
        <Text style={styles.price}>
          ₹{station.pricePerKwh}
          <Text style={styles.priceUnit}>/kWh</Text>
        </Text>
        <TouchableOpacity style={styles.nav} activeOpacity={0.85} onPress={() => Linking.openURL(directionsUrl(station))} accessibilityLabel="Navigate">
          <Ionicons name="navigate" size={14} color={Palette.white} />
          <Text style={styles.navText}>{distanceKm(station).toFixed(1)} km</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function Fact({
  text,
  icon,
  iconColor,
  dot,
  tone,
}: {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  dot?: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  return (
    <View style={[styles.fact, tone === 'good' && styles.factGood, tone === 'warn' && styles.factWarn, tone === 'bad' && styles.factBad]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <Ionicons name={icon} size={12} color={iconColor ?? Palette.mist} /> : null}
      <Text style={[styles.factText, tone === 'good' && { color: Palette.forest }, tone === 'warn' && { color: Palette.amberDeep }, tone === 'bad' && { color: Palette.red }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = scaledSheet({
  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.md, ...Shadow.soft },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badge: { width: 44, height: 44, borderRadius: Radius.chip, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  badgeDc: { backgroundColor: Palette.volt },
  badgeText: { fontFamily: Font.bold, fontSize: 10, color: Palette.forest, marginTop: -1 },
  name: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  address: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 1 },

  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  factGood: { backgroundColor: Palette.voltSoft },
  factWarn: { backgroundColor: Palette.amberSoft },
  factBad: { backgroundColor: Palette.redSoft },
  dot: { width: 6, height: 6, borderRadius: 3 },
  factText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.inkSoft },

  bottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Palette.lineSoft, paddingTop: Spacing.md },
  types: { flexDirection: 'row', gap: 4 },
  typeIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Palette.voltSofter, alignItems: 'center', justifyContent: 'center' },
  price: { fontFamily: Font.display, fontSize: 16, color: Palette.forest },
  priceUnit: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  navText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
});
