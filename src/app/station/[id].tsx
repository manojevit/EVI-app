import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { startSession, toggleFavourite, useAppStore } from '@/data/app-store';
import { CONNECTORS } from '@/data/connectors';
import {
  STATIONS,
  directionsUrl,
  distanceKm,
  freeConnectorCount,
  isOpenNow,
  maxPowerKw,
  stationConnectors,
  stationExtras,
  type AmenityKind,
  type Charger,
  type Connector,
  type Station,
} from '@/data/mock';

const AMENITY_ICON: Record<AmenityKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  food: 'silverware-fork-knife',
  cafe: 'coffee',
  restroom: 'human-male-female',
  wifi: 'wifi',
  parking: 'parking',
  atm: 'cash-multiple',
  shopping: 'shopping',
  pharmacy: 'medical-bag',
};

export default function StationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrollRef = useRef<any>(null);
  const reviewsY = useRef(0);
  const [myRating, setMyRating] = useState(0);
  const session = useAppStore((st) => st.session);

  const station = STATIONS.find((s) => s.id === id) ?? STATIONS[0];
  const fav = useAppStore((st) => st.favourites.includes(station.id));
  const extras = stationExtras(station);
  const total = stationConnectors(station).length;
  const free = freeConnectorCount(station);
  const km = distanceKm(station);
  const open = isOpenNow(station);
  const vehicle = useAppStore((st) => st.vehicles[0]);

  // Does this station have a free connector the user's car can use?
  const freeTypes = new Set(stationConnectors(station).filter((c) => c.availability === 'Available').map((c) => c.type));
  const anyTypes = new Set(stationConnectors(station).map((c) => c.type));
  const fitsNow = vehicle?.connectors.filter((k) => freeTypes.has(k)) ?? [];
  const fitsAtAll = vehicle?.connectors.some((k) => anyTypes.has(k));

  const start = (charger: Charger, connector: Connector) => {
    startSession(station.id, charger.id, connector.id);
    router.navigate('/sessions');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        back
        rightNode={
          <TouchableOpacity onPress={() => toggleFavourite(station.id)} hitSlop={10} style={styles.roundBtn} accessibilityLabel="Save station">
            <Ionicons name={fav ? 'star' : 'star-outline'} size={21} color={fav ? Palette.amber : Palette.ink} />
          </TouchableOpacity>
        }
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* identity */}
        <Text style={styles.name}>{station.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={Palette.mist} />
          <Text style={styles.meta} numberOfLines={1}>
            {station.address}
          </Text>
        </View>
        <View style={styles.chips}>
          <View style={[styles.chip, open ? styles.chipOpen : styles.chipClosed]}>
            <View style={[styles.chipDot, { backgroundColor: open ? Palette.volt : Palette.red }]} />
            <Text style={[styles.chipText, { color: open ? Palette.forest : Palette.red }]}>
              {open ? 'Open now' : 'Closed'} · {station.hours === '24 Hours' ? '24 hours' : station.hours}
            </Text>
          </View>
          <TouchableOpacity style={styles.chip} onPress={() => scrollRef.current?.scrollTo({ y: reviewsY.current, animated: true })} activeOpacity={0.8}>
            <Ionicons name="star" size={13} color={Palette.amber} />
            <Text style={styles.chipText}>
              {extras.rating.toFixed(1)} <Text style={styles.chipMuted}>({extras.reviewCount})</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <VoltButton label={`Navigate · ${km.toFixed(1)} km`} icon="navigate" onPress={() => Linking.openURL(directionsUrl(station))} style={{ marginTop: Spacing.sm }} />

        {/* key facts */}
        <View style={styles.stats}>
          <Stat icon="flash" value={`${maxPowerKw(station)} kW`} label="Fastest" />
          <View style={styles.statLine} />
          <Stat icon="pricetag" value={`₹${station.pricePerKwh}`} label="per kWh" />
          <View style={styles.statLine} />
          <Stat icon="ellipse" value={`${free} of ${total}`} label="Free now" />
        </View>

        {/* fits your vehicle */}
        {vehicle ? (
          <View style={[styles.fit, fitsNow.length ? styles.fitOk : fitsAtAll ? styles.fitBusy : styles.fitNo]}>
            <Ionicons
              name={fitsNow.length ? 'checkmark-circle' : fitsAtAll ? 'time' : 'close-circle'}
              size={20}
              color={fitsNow.length ? Palette.forest : fitsAtAll ? Palette.amber : Palette.red}
            />
            <Text style={styles.fitText}>
              {fitsNow.length
                ? `Fits your ${vehicle.model}: ${fitsNow.map((k) => CONNECTORS[k].label).join(' and ')} free`
                : fitsAtAll
                  ? `Your ${vehicle.model}'s connectors are busy here right now`
                  : `No connector for your ${vehicle.model} here`}
            </Text>
          </View>
        ) : null}

        {/* chargers */}
        <Text style={styles.sectionTitle}>Chargers</Text>
        {session && session.stationId !== station.id ? (
          <Text style={styles.busyNote} onPress={() => router.navigate('/sessions')}>
            You&apos;re already charging somewhere else. Stop that session to start here. <Text style={styles.busyLink}>View session</Text>
          </Text>
        ) : null}
        {station.chargers.map((ch) => (
          <ChargerCard
            key={ch.id}
            charger={ch}
            matches={vehicle?.connectors ?? []}
            activeConnectorId={session?.stationId === station.id && session.chargerId === ch.id ? session.connectorId : null}
            canStart={!session}
            onStart={(c) => start(ch, c)}
            onOpenSession={() => router.navigate('/sessions')}
          />
        ))}

        {/* amenities */}
        {extras.amenities.length ? (
          <>
            <Text style={styles.sectionTitle}>Nearby while you charge</Text>
            <View style={styles.amenities}>
              {extras.amenities.map((a) => (
                <View key={a.name} style={styles.amenity}>
                  <View style={styles.amenityIcon}>
                    <MaterialCommunityIcons name={AMENITY_ICON[a.kind]} size={18} color={Palette.forest} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={styles.amenityDist}>{a.distanceM ? `${a.distanceM} m away` : 'On site'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ratings & reviews */}
        <View onLayout={(e) => (reviewsY.current = e.nativeEvent.layout.y)}>
          <Text style={styles.sectionTitle}>Ratings &amp; reviews</Text>
        </View>
        <Ratings station={station} myRating={myRating} onRate={setMyRating} />
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={15} color={Palette.forest} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ChargerCard({
  charger,
  matches,
  activeConnectorId,
  canStart,
  onStart,
  onOpenSession,
}: {
  charger: Charger;
  matches: string[];
  activeConnectorId: string | null;
  canStart: boolean;
  onStart: (c: Connector) => void;
  onOpenSession: () => void;
}) {
  const off = !charger.online;
  return (
    <View style={[styles.charger, off && styles.chargerOff]}>
      <View style={styles.chHead}>
        <View style={[styles.currentBadge, charger.current === 'DC' ? styles.dcBadge : styles.acBadge, off && styles.badgeOff]}>
          <Text style={[styles.currentText, charger.current === 'DC' && !off && { color: Palette.white }]}>{charger.current}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serial}>{charger.serial}</Text>
          <Text style={styles.chMeta}>
            Up to {charger.powerKw} kW{charger.current === 'DC' ? ' · fast' : ''}
          </Text>
        </View>
        <View style={styles.onlineRow}>
          <View style={[styles.onlineDot, { backgroundColor: off ? Palette.mistLight : Palette.volt }]} />
          <Text style={[styles.onlineText, off && { color: Palette.mistLight }]}>{off ? 'Offline' : 'Online'}</Text>
        </View>
      </View>

      {charger.connectors.map((c) => {
        const mine = c.id === activeConnectorId;
        const free = !off && c.availability === 'Available';
        const inUse = !off && c.availability === 'Charging';
        return (
          <View key={c.id} style={styles.connRow}>
            <View style={[styles.iconBox, !free && !mine && styles.iconBoxMuted]}>
              <ConnectorIcon type={c.type} size={26} muted={!free && !mine} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.connTitleRow}>
                <Text style={[styles.connType, !free && !mine && { color: Palette.mist }]}>{CONNECTORS[c.type].label}</Text>
                {matches.includes(c.type) && (free || mine) ? <Text style={styles.fitsTag}>Your car</Text> : null}
              </View>
              <Text style={styles.connMeta}>Connector {c.number}</Text>
            </View>
            {mine ? (
              <TouchableOpacity style={styles.mineBtn} activeOpacity={0.85} onPress={onOpenSession}>
                <Text style={styles.mineText}>Charging</Text>
              </TouchableOpacity>
            ) : free ? (
              <TouchableOpacity
                style={[styles.startBtn, !canStart && styles.startOff]}
                activeOpacity={0.85}
                disabled={!canStart}
                onPress={() => onStart(c)}>
                <Text style={styles.startText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.statePill, inUse && styles.inUsePill]}>
                <Text style={[styles.stateText, inUse && { color: Palette.amberDeep }]}>{inUse ? 'In use' : 'Unavailable'}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline'} size={size} color={Palette.amber} />
      ))}
    </View>
  );
}

function Ratings({ station, myRating, onRate }: { station: Station; myRating: number; onRate: (n: number) => void }) {
  const e = stationExtras(station);
  return (
    <>
      <View style={styles.card}>
        <View style={styles.ratingTop}>
          <View style={styles.ratingBig}>
            <Text style={styles.ratingValue}>{e.rating.toFixed(1)}</Text>
            <Stars value={e.rating} />
            <Text style={styles.ratingCount}>{e.reviewCount} ratings</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            {e.breakdown.map((share, i) => (
              <View key={i} style={styles.barRow}>
                <Text style={styles.barLabel}>{5 - i}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${share * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.rateBox}>
          <Text style={styles.rateTitle}>{myRating ? 'Thanks for rating!' : 'Charged here? Rate your visit'}</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => onRate(i)} hitSlop={6} accessibilityLabel={`${i} star`}>
                <Ionicons name={myRating >= i ? 'star' : 'star-outline'} size={28} color={Palette.amber} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {e.reviews.map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={styles.reviewHead}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewInitial}>{r.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewName}>{r.name}</Text>
              <Text style={styles.reviewDate}>{r.date}</Text>
            </View>
            <Stars value={r.stars} size={12} />
          </View>
          <Text style={styles.reviewText}>{r.text}</Text>
        </View>
      ))}
    </>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.md },
  roundBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },

  name: { fontFamily: Font.display, fontSize: 23, color: Palette.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -Spacing.sm },
  meta: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Palette.line },
  chipOpen: { backgroundColor: Palette.voltSofter, borderColor: Palette.brandTint2 },
  chipClosed: { backgroundColor: Palette.redSoft, borderColor: Palette.redSoft },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink },
  chipMuted: { fontFamily: Font.regular, color: Palette.mist },

  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface, borderRadius: Radius.card, paddingVertical: Spacing.md, ...Shadow.soft },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: Font.display, fontSize: 16, color: Palette.ink },
  statLabel: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  statLine: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: Palette.line },

  fit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.chip, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  fitOk: { backgroundColor: Palette.voltSoft },
  fitBusy: { backgroundColor: Palette.amberSoft },
  fitNo: { backgroundColor: Palette.redSoft },
  fitText: { flex: 1, fontFamily: Font.semibold, fontSize: 13, color: Palette.ink, lineHeight: 18 },

  sectionTitle: { fontFamily: Font.display, fontSize: 18, color: Palette.ink, marginTop: Spacing.sm },
  busyLink: { fontFamily: Font.bold, color: Palette.amberDeep, textDecorationLine: 'underline' },
  busyNote: { fontFamily: Font.regular, fontSize: 13, color: Palette.amberDeep, backgroundColor: Palette.amberSoft, borderRadius: Radius.chip, padding: Spacing.md, overflow: 'hidden' },

  charger: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, gap: 4, ...Shadow.soft },
  chargerOff: { backgroundColor: Palette.surfaceAlt },
  chHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.line },
  currentBadge: { width: 40, height: 40, borderRadius: Radius.chip, alignItems: 'center', justifyContent: 'center' },
  dcBadge: { backgroundColor: Palette.volt },
  acBadge: { backgroundColor: Palette.voltSoft },
  badgeOff: { backgroundColor: Palette.canvasDeep },
  currentText: { fontFamily: Font.display, fontSize: 13, color: Palette.forest },
  serial: { fontFamily: Font.displaySemi, fontSize: 15, color: Palette.ink },
  chMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },

  connRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 6 },
  iconBox: { width: 42, height: 42, borderRadius: Radius.chip, backgroundColor: Palette.voltSofter, alignItems: 'center', justifyContent: 'center' },
  iconBoxMuted: { backgroundColor: Palette.canvasDeep },
  connTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  connType: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  fitsTag: { fontFamily: Font.bold, fontSize: 10, color: Palette.forest, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  connMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  startBtn: { backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 8 },
  startOff: { opacity: 0.4 },
  startText: { fontFamily: Font.bold, fontSize: 13, color: Palette.white },
  mineBtn: { backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Palette.volt },
  mineText: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest },
  statePill: { backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  inUsePill: { backgroundColor: Palette.amberSoft },
  stateText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist },

  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenity: { flexBasis: '45%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.surface, borderRadius: Radius.chip, padding: Spacing.md, ...Shadow.soft },
  amenityIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  amenityName: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink },
  amenityDist: { fontFamily: Font.regular, fontSize: 11, color: Palette.mist, marginTop: 1 },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.lg, ...Shadow.soft },
  ratingTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  ratingBig: { alignItems: 'center', gap: 3 },
  ratingValue: { fontFamily: Font.display, fontSize: 36, color: Palette.ink, lineHeight: 40 },
  ratingCount: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontFamily: Font.semibold, fontSize: 11, color: Palette.mist, width: 8 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Palette.canvasDeep, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: Palette.amber },
  rateBox: { alignItems: 'center', gap: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Palette.line, paddingTop: Spacing.lg },
  rateTitle: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },

  review: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.sm, ...Shadow.soft },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  reviewInitial: { fontFamily: Font.bold, fontSize: 14, color: Palette.forest },
  reviewName: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  reviewDate: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  reviewText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: Palette.inkSoft },
});
