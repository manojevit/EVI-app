import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { s, scaledSheet } from '@/constants/responsive';
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
  type Amenity,
  type AmenityKind,
  type Charger,
  type Connector,
  type Station,
} from '@/data/mock';
import { stationPhotos, type StationPhoto } from '@/data/station-photos';

/** Each kind of place nearby gets its own icon and colour, so the row reads at a glance. */
const AMENITY: Record<AmenityKind, { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; tint: string; ink: string }> = {
  food: { icon: 'silverware-fork-knife', label: 'Food', tint: '#FFF0E3', ink: '#C25E12' },
  cafe: { icon: 'coffee', label: 'Café', tint: '#F6ECE4', ink: '#7A4A2A' },
  restroom: { icon: 'human-male-female', label: 'Restroom', tint: '#E7F0FB', ink: '#2F64A8' },
  wifi: { icon: 'wifi', label: 'Wi-Fi', tint: '#EFEAFB', ink: '#5B45A8' },
  parking: { icon: 'parking', label: 'Parking', tint: '#E3F4F3', ink: '#1C7A74' },
  atm: { icon: 'cash-multiple', label: 'ATM', tint: '#E8F4EC', ink: '#17713A' },
  shopping: { icon: 'shopping', label: 'Shopping', tint: '#FBE9F1', ink: '#A83A6C' },
  pharmacy: { icon: 'medical-bag', label: 'Pharmacy', tint: '#FBE7E5', ink: '#B23A30' },
};
const WALK_M_PER_MIN = 80;

const SLIDE_MS = 3500;

export default function StationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrollRef = useRef<any>(null);
  const reviewsY = useRef(0);
  const [myRating, setMyRating] = useState(0);
  const session = useAppStore((st) => st.session);

  const station = STATIONS.find((x) => x.id === id) ?? STATIONS[0];
  const fav = useAppStore((st) => st.favourites.includes(station.id));
  const extras = stationExtras(station);
  const total = stationConnectors(station).length;
  const free = freeConnectorCount(station);
  const km = distanceKm(station);
  const open = isOpenNow(station);
  const dc = station.chargers.some((c) => c.current === 'DC' && c.online);
  const vehicle = useAppStore((st) => st.vehicles[0]);
  const galleryH = s(250) + insets.top;

  // light status bar over the photo while this screen is in front
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

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
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Gallery photos={stationPhotos(station.id)} height={galleryH} topInset={insets.top} />

        <View style={styles.sheet}>
          {/* identity */}
          <Text style={styles.name}>{station.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={Palette.mist} />
            <Text style={styles.meta} numberOfLines={2}>
              {station.address}, {station.city}
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
            {dc ? (
              <View style={[styles.chip, styles.chipFast]}>
                <Ionicons name="flash" size={13} color={Palette.forest} />
                <Text style={[styles.chipText, { color: Palette.forest }]}>DC fast</Text>
              </View>
            ) : null}
          </View>

          {/* key facts */}
          <View style={styles.tiles}>
            <Tile icon="flash" value={`${maxPowerKw(station)}`} unit="kW" label="Fastest" />
            <Tile icon="pricetag" value={`₹${station.pricePerKwh}`} unit="/kWh" label="Price" />
            <Tile icon="radio-button-on" value={`${free}`} unit={`of ${total}`} label="Free now" live={free > 0} />
          </View>

          <VoltButton label={`Navigate · ${km.toFixed(1)} km`} icon="navigate" onPress={() => Linking.openURL(directionsUrl(station))} />

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
          <SectionTitle title="Chargers" note={`${station.chargers.length} on site`} />
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

          {/* nearby */}
          {extras.amenities.length ? <Nearby amenities={extras.amenities} /> : null}

          {/* ratings & reviews */}
          <View onLayout={(e) => (reviewsY.current = e.nativeEvent.layout.y + galleryH + s(-26))}>
            <SectionTitle title="Ratings & reviews" />
          </View>
          <Ratings station={station} myRating={myRating} onRate={setMyRating} />
        </View>
      </ScrollView>

      {/* floating controls over the photo */}
      <View style={[styles.floatBar, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.glassBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={Palette.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFavourite(station.id)} hitSlop={10} style={styles.glassBtn} accessibilityLabel="Save station">
          <Ionicons name={fav ? 'star' : 'star-outline'} size={21} color={fav ? '#FFC94D' : Palette.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------- photo gallery (auto-slides, pauses while you swipe) ----------

function Gallery({ photos, height, topInset }: { photos: StationPhoto[]; height: number; topInset: number }) {
  const { width } = useWindowDimensions();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || photos.length < 2) return;
    const t = setTimeout(() => {
      const next = (index + 1) % photos.length;
      ref.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, photos.length, width]);

  return (
    <View style={{ height }}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setPaused(true)}
        onScrollEndDrag={() => setPaused(false)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        // web has no momentum events; keep the dots in step while scrolling
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index && i >= 0 && i < photos.length) setIndex(i);
        }}
        scrollEventThrottle={64}>
        {photos.map((p, i) => (
          <Image key={i} source={p.source} style={{ width, height }} contentFit="cover" transition={250} />
        ))}
      </ScrollView>
      <LinearGradient colors={['rgba(6,20,12,0.55)', 'rgba(6,20,12,0)']} style={[styles.galleryTopShade, { height: topInset + 70 }]} pointerEvents="none" />
      <LinearGradient colors={['rgba(6,20,12,0)', 'rgba(6,20,12,0.6)']} style={styles.galleryBottomShade} pointerEvents="none" />
      <View style={styles.galleryFoot} pointerEvents="none">
        <View style={styles.caption}>
          <Ionicons name="images-outline" size={13} color={Palette.white} />
          <Text style={styles.captionText} numberOfLines={1}>
            {photos[index]?.caption}
          </Text>
        </View>
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------- pieces ----------

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </View>
  );
}

function Tile({ icon, value, unit, label, live }: { icon: keyof typeof Ionicons.glyphMap; value: string; unit: string; label: string; live?: boolean }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={15} color={live === false ? Palette.amber : Palette.forest} />
      </View>
      <Text style={styles.tileValue}>
        {value}
        <Text style={styles.tileUnit}> {unit}</Text>
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function Nearby({ amenities }: { amenities: Amenity[] }) {
  const within5 = amenities.filter((a) => a.distanceM <= WALK_M_PER_MIN * 5).length;
  return (
    <>
      <SectionTitle title="Nearby while you charge" note={`${within5} within a 5-min walk`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearRow} style={styles.nearScroll}>
        {amenities.map((a) => {
          const k = AMENITY[a.kind];
          const mins = Math.max(1, Math.round(a.distanceM / WALK_M_PER_MIN));
          return (
            <View key={a.name} style={[styles.place, { backgroundColor: k.tint }]}>
              <View style={styles.placeTop}>
                <View style={styles.placeIcon}>
                  <MaterialCommunityIcons name={k.icon} size={22} color={k.ink} />
                </View>
                <Text style={[styles.placeKind, { color: k.ink }]}>{k.label}</Text>
              </View>
              <Text style={styles.placeName} numberOfLines={2}>
                {a.name}
              </Text>
              <View style={styles.placeFoot}>
                <MaterialCommunityIcons name={a.distanceM ? 'walk' : 'map-marker-check'} size={14} color={k.ink} />
                <Text style={[styles.placeDist, { color: k.ink }]}>{a.distanceM ? `${mins} min · ${a.distanceM} m` : 'On site'}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </>
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
          <Ionicons name="flash" size={13} color={charger.current === 'DC' && !off ? Palette.white : Palette.forest} />
          <Text style={[styles.currentText, charger.current === 'DC' && !off && { color: Palette.white }]}>{charger.current}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serial}>{charger.serial}</Text>
          <Text style={styles.chMeta}>
            Up to {charger.powerKw} kW{charger.current === 'DC' ? ' · fast' : ''}
          </Text>
        </View>
        <View style={[styles.onlineRow, off && styles.onlineRowOff]}>
          <View style={[styles.onlineDot, { backgroundColor: off ? Palette.mistLight : Palette.volt }]} />
          <Text style={[styles.onlineText, off && { color: Palette.mist }]}>{off ? 'Offline' : 'Online'}</Text>
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
              <TouchableOpacity style={[styles.startBtn, !canStart && styles.startOff]} activeOpacity={0.85} disabled={!canStart} onPress={() => onStart(c)}>
                <Ionicons name="flash" size={13} color={Palette.white} />
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
  scrollContent: { paddingBottom: 48 },

  floatBar: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  glassBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(10,25,17,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },

  galleryTopShade: { position: 'absolute', top: 0, left: 0, right: 0 },
  galleryBottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
  galleryFoot: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, bottom: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  caption: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,25,17,0.45)', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  captionText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.white },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotOn: { width: 18, backgroundColor: Palette.white },

  sheet: { marginTop: -26, backgroundColor: Palette.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.md },

  name: { fontFamily: Font.display, fontSize: 25, color: Palette.ink, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -Spacing.sm },
  meta: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Palette.line },
  chipOpen: { backgroundColor: Palette.voltSofter, borderColor: Palette.brandTint2 },
  chipClosed: { backgroundColor: Palette.redSoft, borderColor: Palette.redSoft },
  chipFast: { backgroundColor: Palette.voltSoft, borderColor: Palette.brandTint2 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink },
  chipMuted: { fontFamily: Font.regular, color: Palette.mist },

  tiles: { flexDirection: 'row', gap: Spacing.sm },
  tile: { flex: 1, backgroundColor: Palette.surface, borderRadius: 18, padding: Spacing.md, gap: 4, ...Shadow.soft },
  tileIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  tileValue: { fontFamily: Font.display, fontSize: 19, color: Palette.ink },
  tileUnit: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  tileLabel: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },

  fit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.chip, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  fitOk: { backgroundColor: Palette.voltSoft },
  fitBusy: { backgroundColor: Palette.amberSoft },
  fitNo: { backgroundColor: Palette.redSoft },
  fitText: { flex: 1, fontFamily: Font.semibold, fontSize: 13, color: Palette.ink, lineHeight: 18 },

  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: Spacing.md },
  sectionTitle: { fontFamily: Font.display, fontSize: 18, color: Palette.ink },
  sectionNote: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  busyLink: { fontFamily: Font.bold, color: Palette.amberDeep, textDecorationLine: 'underline' },
  busyNote: { fontFamily: Font.regular, fontSize: 13, color: Palette.amberDeep, backgroundColor: Palette.amberSoft, borderRadius: Radius.chip, padding: Spacing.md, overflow: 'hidden' },

  charger: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, gap: 4, ...Shadow.soft },
  chargerOff: { backgroundColor: Palette.surfaceAlt },
  chHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.line },
  currentBadge: { flexDirection: 'row', gap: 2, height: 40, paddingHorizontal: 10, borderRadius: Radius.chip, alignItems: 'center', justifyContent: 'center' },
  dcBadge: { backgroundColor: Palette.volt },
  acBadge: { backgroundColor: Palette.voltSoft },
  badgeOff: { backgroundColor: Palette.canvasDeep },
  currentText: { fontFamily: Font.display, fontSize: 13, color: Palette.forest },
  serial: { fontFamily: Font.displaySemi, fontSize: 15, color: Palette.ink },
  chMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.voltSofter, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  onlineRowOff: { backgroundColor: Palette.canvasDeep },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },

  connRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 6 },
  iconBox: { width: 42, height: 42, borderRadius: Radius.chip, backgroundColor: Palette.voltSofter, alignItems: 'center', justifyContent: 'center' },
  iconBoxMuted: { backgroundColor: Palette.canvasDeep },
  connTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  connType: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  fitsTag: { fontFamily: Font.bold, fontSize: 10, color: Palette.forest, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  connMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 9, ...Shadow.volt },
  startOff: { opacity: 0.4 },
  startText: { fontFamily: Font.bold, fontSize: 13, color: Palette.white },
  mineBtn: { backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Palette.volt },
  mineText: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest },
  statePill: { backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  inUsePill: { backgroundColor: Palette.amberSoft },
  stateText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist },

  nearScroll: { marginHorizontal: -Spacing.lg },
  nearRow: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  place: { width: 150, borderRadius: Radius.card, padding: Spacing.md, gap: Spacing.sm, justifyContent: 'space-between', minHeight: 150 },
  placeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  placeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.white, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },
  placeKind: { fontFamily: Font.bold, fontSize: 11 },
  placeName: { fontFamily: Font.displaySemi, fontSize: 14, color: Palette.ink, lineHeight: 19 },
  placeFoot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeDist: { fontFamily: Font.semibold, fontSize: 12 },

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
