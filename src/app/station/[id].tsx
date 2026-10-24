import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import AppHeader from '@/components/app-header';
import ConnectorIcon from '@/components/connector-icon';
import LiveMap from '@/components/live-map';
import VoltButton from '@/components/volt-button';
import { s, scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { startSession, submitReview, toggleFavourite, useAppStore } from '@/data/app-store';
import { CONNECTORS, type ConnectorKey } from '@/data/connectors';
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
  type Review,
  type Station,
} from '@/data/mock';
import { stationPhotos, type StationPhoto } from '@/data/station-photos';

/** Each kind of place nearby gets its own icon and colour, so the list reads at a glance. */
const AMENITY: Record<AmenityKind, { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; tint: string; ink: string }> = {
  food: { icon: 'silverware-fork-knife', label: 'Food', tint: '#FFF0E3', ink: '#B4560F' },
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
const STAR_WORDS = ['', 'Poor', 'Below average', 'Okay', 'Good', 'Excellent'];
const GOOD_TAGS = ['Fast charging', 'Easy to find', 'Clean & safe', 'Fair price', 'Helpful staff'];
const BAD_TAGS = ['Slow charging', 'Hard to find', 'Connector problem', 'Long wait', 'Not clean'];

const TABS = ['Chargers', 'Info', 'Nearby', 'Reviews'] as const;
type Tab = (typeof TABS)[number];

const kmLabel = (km: number) => `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;

export default function StationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrollRef = useRef<any>(null);
  const tabsY = useRef(0);
  const scrollY = useRef(0);
  const [tab, setTab] = useState<Tab>('Chargers');
  const session = useAppStore((st) => st.session);
  const from = useAppStore((st) => st.location);

  const station = STATIONS.find((x) => x.id === id) ?? STATIONS[0];
  const fav = useAppStore((st) => st.favourites.includes(station.id));
  const mine = useAppStore((st) => st.myReviews[station.id]);
  const extras = stationExtras(station);
  const total = stationConnectors(station).length;
  const free = freeConnectorCount(station);
  const km = distanceKm(station, from);
  const open = isOpenNow(station);
  const dc = station.chargers.some((c) => c.current === 'DC' && c.online);
  const vehicle = useAppStore((st) => st.vehicles[0]);
  // the user's own review counts towards the average
  const rating = mine ? (extras.rating * extras.reviewCount + mine.stars) / (extras.reviewCount + 1) : extras.rating;
  const ratingCount = extras.reviewCount + (mine ? 1 : 0);

  const openTab = (t: Tab) => {
    setTab(t);
    // keep the tabs in view when switching from further down the page
    if (scrollY.current > tabsY.current) scrollRef.current?.scrollTo({ y: tabsY.current, animated: false });
  };

  const start = (charger: Charger, connector: Connector) => {
    startSession(station.id, charger.id, connector.id);
    router.navigate('/sessions');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        back
        rightNode={
          <TouchableOpacity onPress={() => toggleFavourite(station.id)} hitSlop={10} style={styles.roundBtn} accessibilityLabel={fav ? 'Remove from saved' : 'Save station'}>
            <Ionicons name={fav ? 'star' : 'star-outline'} size={21} color={fav ? Palette.amber : Palette.ink} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[1]}
        onScroll={(e) => (scrollY.current = e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 0: summary */}
        <View style={styles.top}>
          <Gallery photos={stationPhotos(station.id)} width={width - s(Spacing.lg) * 2} />

          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{station.name}</Text>
              <Text style={styles.meta} numberOfLines={2}>
                {station.address}, {station.city}
              </Text>
            </View>
            <TouchableOpacity style={styles.ratingBadge} onPress={() => openTab('Reviews')} activeOpacity={0.8} accessibilityLabel="See reviews">
              <Ionicons name="star" size={13} color={Palette.amber} />
              <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chips}>
            <View style={[styles.chip, open ? styles.chipOpen : styles.chipClosed]}>
              <View style={[styles.chipDot, { backgroundColor: open ? Palette.volt : Palette.red }]} />
              <Text style={[styles.chipText, { color: open ? Palette.forest : Palette.red }]}>{open ? 'Open now' : 'Closed'}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="flash" size={12} color={Palette.forest} />
              <Text style={styles.chipText}>
                {maxPowerKw(station)} kW {dc ? 'DC' : 'AC'}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>₹{station.pricePerKwh}/kWh</Text>
            </View>
            <View style={[styles.chip, free ? styles.chipOpen : styles.chipBusy]}>
              <Text style={[styles.chipText, { color: free ? Palette.forest : Palette.amberDeep }]}>
                {free} of {total} free
              </Text>
            </View>
          </View>

          <VoltButton label={`Navigate · ${kmLabel(km)}`} icon="navigate" onPress={() => Linking.openURL(directionsUrl(station))} />
        </View>

        {/* 1: tabs (stick to the top while scrolling) */}
        <View
          style={styles.tabsWrap}
          onLayout={(e) => {
            tabsY.current = e.nativeEvent.layout.y;
          }}>
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <TouchableOpacity key={t} onPress={() => openTab(t)} activeOpacity={0.85} style={[styles.tab, tab === t && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
                <Text style={[styles.tabText, tab === t && styles.tabTextOn]} numberOfLines={1}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2: the open tab */}
        <View style={styles.body}>
          {tab === 'Chargers' ? (
            <>
              <Text style={styles.tabNote}>
                {station.chargers.length} {station.chargers.length === 1 ? 'charger' : 'chargers'} · {total} connectors ·{' '}
                <Text style={{ color: free ? Palette.forest : Palette.amberDeep, fontFamily: Font.semibold }}>{free} free now</Text>
              </Text>
              {vehicle ? <FitBanner station={station} vehicle={vehicle} /> : null}
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
            </>
          ) : null}
          {tab === 'Info' ? <InfoTab station={station} open={open} km={km} from={from} onReport={() => router.push('/new-ticket')} /> : null}
          {tab === 'Nearby' ? <NearbyTab station={station} amenities={extras.amenities} /> : null}
          {tab === 'Reviews' ? <ReviewsTab station={station} rating={rating} ratingCount={ratingCount} mine={mine} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------- photo gallery (auto-slides, pauses while you swipe) ----------

function Gallery({ photos, width }: { photos: StationPhoto[]; width: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const height = Math.round(Math.min(width * 0.52, 300));

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
    <View style={[styles.gallery, { width, height }]}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => setPaused(true)}
        onScrollEndDrag={() => setPaused(false)}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index && i >= 0 && i < photos.length) setIndex(i);
        }}
        scrollEventThrottle={64}>
        {photos.map((p, i) => (
          <Image key={i} source={p.source} style={{ width, height }} contentFit="cover" transition={250} />
        ))}
      </ScrollView>
      <LinearGradient colors={['rgba(6,20,12,0)', 'rgba(6,20,12,0.55)']} style={styles.galleryShade} pointerEvents="none" />
      <View style={styles.galleryFoot} pointerEvents="none">
        <Text style={styles.captionText} numberOfLines={1}>
          {photos[index]?.caption}
        </Text>
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------- Chargers tab ----------

function FitBanner({ station, vehicle }: { station: Station; vehicle: { model: string; connectors: string[] } }) {
  const freeTypes = new Set(stationConnectors(station).filter((c) => c.availability === 'Available').map((c) => c.type as string));
  const anyTypes = new Set(stationConnectors(station).map((c) => c.type as string));
  const fitsNow = vehicle.connectors.filter((k) => freeTypes.has(k));
  const fitsAtAll = vehicle.connectors.some((k) => anyTypes.has(k));
  return (
    <View style={[styles.fit, fitsNow.length ? styles.fitOk : fitsAtAll ? styles.fitBusy : styles.fitNo]}>
      <Ionicons
        name={fitsNow.length ? 'checkmark-circle' : fitsAtAll ? 'time' : 'close-circle'}
        size={20}
        color={fitsNow.length ? Palette.forest : fitsAtAll ? Palette.amber : Palette.red}
      />
      <Text style={styles.fitText}>
        {fitsNow.length
          ? `Fits your ${vehicle.model}: ${fitsNow.map((k) => CONNECTORS[k as ConnectorKey].label).join(' and ')} free`
          : fitsAtAll
            ? `Your ${vehicle.model}'s connectors are busy here right now`
            : `No connector for your ${vehicle.model} here`}
      </Text>
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
  const isDc = charger.current === 'DC';
  const state = (c: Connector) =>
    c.id === activeConnectorId ? 'mine' : off ? 'off' : c.availability === 'Available' ? 'free' : c.availability === 'Charging' ? 'busy' : 'off';
  const freeHere = charger.connectors.filter((c) => state(c) === 'free').length;

  return (
    <View style={[styles.charger, off && styles.chargerOff]}>
      <View style={styles.chHead}>
        <View style={[styles.currentBadge, isDc ? styles.dcBadge : styles.acBadge, off && styles.badgeOff]}>
          <Ionicons name="flash" size={14} color={isDc && !off ? Palette.white : off ? Palette.mist : Palette.forest} />
          <Text style={[styles.currentText, isDc && !off && { color: Palette.white }, off && { color: Palette.mist }]}>{charger.current}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.serial}>{charger.serial}</Text>
          <Text style={styles.chMeta}>
            {isDc ? 'DC fast' : 'AC'} · up to {charger.powerKw} kW
          </Text>
        </View>
        <View style={[styles.onlineRow, off && styles.onlineRowOff]}>
          <View style={[styles.onlineDot, { backgroundColor: off ? Palette.mistLight : Palette.volt }]} />
          <Text style={[styles.onlineText, off && { color: Palette.mist }]}>{off ? 'Offline' : 'Online'}</Text>
        </View>
      </View>

      {/* one segment per connector */}
      <View style={styles.segRow}>
        <View style={styles.segs}>
          {charger.connectors.map((c) => {
            const st = state(c);
            return <View key={c.id} style={[styles.seg, { backgroundColor: st === 'free' || st === 'mine' ? Palette.volt : st === 'busy' ? Palette.amber : Palette.line }]} />;
          })}
        </View>
        <Text style={styles.segText}>{off ? 'Not available' : `${freeHere} of ${charger.connectors.length} free`}</Text>
      </View>

      {charger.connectors.map((c, i) => {
        const st = state(c);
        const lit = st === 'free' || st === 'mine';
        const label = { mine: 'Your session', free: 'Available', busy: 'In use', off: off ? 'Offline' : 'Unavailable' }[st];
        const tone = { mine: Palette.forest, free: Palette.forest, busy: Palette.amberDeep, off: Palette.mist }[st];
        return (
          <View key={c.id} style={[styles.connRow, i > 0 && styles.connDivider]}>
            <View style={[styles.iconBox, !lit && styles.iconBoxMuted]}>
              <ConnectorIcon type={c.type} size={34} original muted={!lit} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.connTitleRow}>
                <Text style={[styles.connType, !lit && { color: Palette.mist }]} numberOfLines={1}>
                  {CONNECTORS[c.type].label}
                </Text>
                {matches.includes(c.type) && lit ? <Text style={styles.fitsTag}>Your car</Text> : null}
              </View>
              <Text style={styles.connMeta} numberOfLines={1}>
                Connector {c.number} · <Text style={{ color: tone, fontFamily: Font.semibold }}>{label}</Text>
              </Text>
            </View>
            {st === 'mine' ? (
              <TouchableOpacity style={styles.mineBtn} activeOpacity={0.85} onPress={onOpenSession}>
                <Text style={styles.mineText}>View</Text>
              </TouchableOpacity>
            ) : st === 'free' ? (
              <TouchableOpacity style={[styles.startBtn, !canStart && styles.startOff]} activeOpacity={0.85} disabled={!canStart} onPress={() => onStart(c)} accessibilityLabel={`Start charging on connector ${c.number}`}>
                <Ionicons name="flash" size={13} color={Palette.white} />
                <Text style={styles.startText}>Start</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ---------- Info tab ----------

function InfoTab({
  station,
  open,
  km,
  from,
  onReport,
}: {
  station: Station;
  open: boolean;
  km: number;
  from: { latitude: number; longitude: number };
  onReport: () => void;
}) {
  const types = [...new Set(stationConnectors(station).map((c) => c.type))];

  return (
    <>
      {/* where */}
      <View style={styles.card}>
        <View style={styles.mapBox}>
          <LiveMap
            pins={[{ id: station.id, latitude: station.latitude, longitude: station.longitude, available: freeConnectorCount(station) > 0 }]}
            user={from}
            fit={[[station.longitude, station.latitude]]}
            interactive={false}
            padding={{ top: 60, bottom: 20, left: 40, right: 40 }}
          />
        </View>
        <View style={styles.whereRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              {station.address}, {station.city}
            </Text>
            <Text style={styles.infoSub}>{kmLabel(km)} from you</Text>
          </View>
          <TouchableOpacity style={styles.dirBtn} onPress={() => Linking.openURL(directionsUrl(station))} activeOpacity={0.8} accessibilityLabel="Get directions">
            <Ionicons name="navigate" size={18} color={Palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* the essentials, one line each */}
      <View style={styles.card}>
        <InfoRow icon="time-outline" label="Hours">
          <Text style={styles.infoValue}>
            {station.hours === '24 Hours' ? 'Open 24 hours' : station.hours} ·{' '}
            <Text style={{ color: open ? Palette.forest : Palette.red }}>{open ? 'Open now' : 'Closed now'}</Text>
          </Text>
        </InfoRow>
        <InfoRow icon="pricetag-outline" label="Price">
          <Text style={styles.infoValue}>₹{station.pricePerKwh} per kWh</Text>
        </InfoRow>
        <InfoRow icon="wallet-outline" label="Pay with">
          <Text style={styles.infoValue}>UPI, card or EVIT wallet</Text>
        </InfoRow>
        <InfoRow icon="flash-outline" label="Connectors" last>
          <View style={styles.typeIcons}>
            {types.map((k) => (
              <ConnectorIcon key={k} type={k} size={24} original />
            ))}
          </View>
        </InfoRow>
      </View>

      <TouchableOpacity style={styles.reportRow} onPress={onReport} activeOpacity={0.7}>
        <Ionicons name="alert-circle-outline" size={18} color={Palette.red} />
        <Text style={styles.reportText}>Report a problem with this station</Text>
        <Ionicons name="chevron-forward" size={17} color={Palette.mistLight} />
      </TouchableOpacity>
    </>
  );
}

function InfoRow({ icon, label, last, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; last?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <Ionicons name={icon} size={19} color={Palette.forest} />
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoRight}>{children}</View>
    </View>
  );
}

// ---------- Nearby tab ----------

function NearbyTab({ station, amenities }: { station: Station; amenities: Amenity[] }) {
  const [kind, setKind] = useState<AmenityKind | 'all'>('all');
  if (!amenities.length) return <Text style={styles.emptyText}>No places listed near this station yet.</Text>;

  const onSite = amenities.filter((a) => !a.distanceM);
  const walk = amenities.filter((a) => a.distanceM).sort((a, b) => a.distanceM - b.distanceM);
  const kinds = [...new Set(walk.map((a) => a.kind))];
  const shown = kind === 'all' ? walk : walk.filter((a) => a.kind === kind);
  const walkTo = (a: Amenity) =>
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&origin=${station.latitude},${station.longitude}&destination=${encodeURIComponent(`${a.name}, ${station.address}, ${station.city}`)}&travelmode=walking`,
    );

  return (
    <>
      {onSite.length ? (
        <View style={[styles.card, styles.cardPad]}>
          <Text style={styles.cardTitle}>At the station</Text>
          <View style={styles.onSiteRow}>
            {onSite.map((a) => {
              const k = AMENITY[a.kind];
              return (
                <View key={a.name} style={[styles.onSite, { backgroundColor: k.tint }]}>
                  <MaterialCommunityIcons name={k.icon} size={16} color={k.ink} />
                  <Text style={[styles.onSiteText, { color: k.ink }]}>{a.name}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {walk.length ? (
        <>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Walk to while you charge</Text>
            <Text style={styles.tabNote}>{walk.length} places</Text>
          </View>
          {kinds.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
              {(['all', ...kinds] as const).map((k) => (
                <TouchableOpacity key={k} onPress={() => setKind(k)} activeOpacity={0.85} style={[styles.filter, kind === k && styles.filterOn]}>
                  {k !== 'all' ? <MaterialCommunityIcons name={AMENITY[k].icon} size={14} color={kind === k ? Palette.white : AMENITY[k].ink} /> : null}
                  <Text style={[styles.filterText, kind === k && styles.filterTextOn]}>{k === 'all' ? 'All' : AMENITY[k].label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
          <View style={styles.card}>
            {shown.map((a, i) => {
              const k = AMENITY[a.kind];
              const mins = Math.max(1, Math.round(a.distanceM / WALK_M_PER_MIN));
              return (
                <View key={a.name} style={[styles.placeRow, i > 0 && styles.connDivider]}>
                  <View style={[styles.placeIcon, { backgroundColor: k.tint }]}>
                    <MaterialCommunityIcons name={k.icon} size={22} color={k.ink} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={styles.placeMeta}>
                      {k.label} · {mins} min walk · {a.distanceM} m
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.walkBtn} onPress={() => walkTo(a)} activeOpacity={0.8} accessibilityLabel={`Walking directions to ${a.name}`}>
                    <MaterialCommunityIcons name="walk" size={18} color={Palette.forest} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </>
  );
}

// ---------- Reviews tab ----------

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline'} size={size} color={Palette.amber} />
      ))}
    </View>
  );
}

function ReviewsTab({ station, rating, ratingCount, mine }: { station: Station; rating: number; ratingCount: number; mine?: Review }) {
  const e = stationExtras(station);
  const [editing, setEditing] = useState(false);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const writing = !mine || editing;
  const tagSet = stars >= 4 ? GOOD_TAGS : BAD_TAGS;

  const startEdit = () => {
    if (!mine) return;
    setStars(mine.stars);
    setTags(mine.tags ?? []);
    setText(mine.text);
    setEditing(true);
  };
  const pickStars = (n: number) => {
    // switching between happy and unhappy clears tags that no longer apply
    if ((n >= 4) !== (stars >= 4)) setTags([]);
    setStars(n);
  };
  const post = () => {
    submitReview(station.id, { stars, text, tags });
    setEditing(false);
    setStars(0);
    setTags([]);
    setText('');
  };

  return (
    <>
      <View style={[styles.card, styles.cardPad]}>
        <View style={styles.ratingTop}>
          <View style={styles.ratingBig}>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            <Stars value={rating} />
            <Text style={styles.ratingCount}>{ratingCount} ratings</Text>
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
      </View>

      {writing ? (
        <View style={[styles.card, styles.cardPad, styles.rateCard]}>
          <Text style={styles.cardTitle}>{mine ? 'Edit your review' : 'Rate this station'}</Text>
          <Text style={styles.infoSub}>Charged here? Your rating helps other drivers.</Text>
          <View style={styles.bigStars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => pickStars(i)} hitSlop={6} accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`}>
                <Ionicons name={stars >= i ? 'star' : 'star-outline'} size={36} color={Palette.amber} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.starWord}>{stars ? STAR_WORDS[stars] : 'Tap a star to rate'}</Text>

          {stars ? (
            <>
              <Text style={styles.fieldLabel}>{stars >= 4 ? 'What went well?' : 'What went wrong?'}</Text>
              <View style={styles.tagWrap}>
                {tagSet.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <TouchableOpacity key={t} onPress={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])} activeOpacity={0.85} style={[styles.tag, on && styles.tagOn]}>
                      {on ? <Ionicons name="checkmark" size={13} color={Palette.white} /> : null}
                      <Text style={[styles.tagText, on && styles.tagTextOn]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Tell others about your visit (optional)"
                placeholderTextColor={Palette.mistLight}
                multiline
                maxLength={300}
                style={styles.input}
              />
              <View style={styles.formBtns}>
                {editing ? (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)} activeOpacity={0.8}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
                <VoltButton label={mine ? 'Update review' : 'Post review'} onPress={post} style={{ flex: 1 }} />
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {mine && !editing ? <ReviewCard r={mine} own onEdit={startEdit} /> : null}
      {e.reviews.map((r) => (
        <ReviewCard key={r.id} r={r} />
      ))}
    </>
  );
}

function ReviewCard({ r, own, onEdit }: { r: Review; own?: boolean; onEdit?: () => void }) {
  return (
    <View style={[styles.review, own && styles.reviewOwn]}>
      <View style={styles.reviewHead}>
        <View style={[styles.reviewAvatar, own && { backgroundColor: Palette.forest }]}>
          <Text style={[styles.reviewInitial, own && { color: Palette.white }]}>{r.name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewName}>{own ? `${r.name} (you)` : r.name}</Text>
          <Text style={styles.reviewDate}>{r.date}</Text>
        </View>
        <Stars value={r.stars} size={12} />
      </View>
      {r.tags?.length ? (
        <View style={styles.tagWrap}>
          {r.tags.map((t) => (
            <Text key={t} style={styles.reviewTag}>
              {t}
            </Text>
          ))}
        </View>
      ) : null}
      {r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}
      {own ? (
        <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.editLink}>
          <Ionicons name="create-outline" size={15} color={Palette.forest} />
          <Text style={styles.editText}>Edit review</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scrollContent: { paddingBottom: 48 },
  roundBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },

  top: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md },
  gallery: { borderRadius: Radius.card, overflow: 'hidden', backgroundColor: Palette.canvasDeep },
  galleryShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 },
  galleryFoot: { position: 'absolute', left: Spacing.md, right: Spacing.md, bottom: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  captionText: { flexShrink: 1, fontFamily: Font.semibold, fontSize: 12, color: Palette.white },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotOn: { width: 16, backgroundColor: Palette.white },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  name: { fontFamily: Font.display, fontSize: 22, color: Palette.ink, letterSpacing: -0.2 },
  meta: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, marginTop: 2 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.amberSoft, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6, marginTop: 2 },
  ratingBadgeText: { fontFamily: Font.bold, fontSize: 13, color: Palette.amberDeep },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Palette.line },
  chipOpen: { backgroundColor: Palette.voltSofter, borderColor: Palette.brandTint2 },
  chipClosed: { backgroundColor: Palette.redSoft, borderColor: Palette.redSoft },
  chipBusy: { backgroundColor: Palette.amberSoft, borderColor: Palette.amberSoft },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink },

  tabsWrap: { backgroundColor: Palette.canvas, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  tabs: { flexDirection: 'row', backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: Radius.pill },
  tabOn: { backgroundColor: Palette.surface, ...Shadow.soft },
  tabText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist },
  tabTextOn: { color: Palette.forest, fontFamily: Font.bold },

  body: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md, minHeight: 420 },
  tabNote: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },
  emptyText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, textAlign: 'center', paddingVertical: Spacing.xxl },

  fit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.chip, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  fitOk: { backgroundColor: Palette.voltSoft },
  fitBusy: { backgroundColor: Palette.amberSoft },
  fitNo: { backgroundColor: Palette.redSoft },
  fitText: { flex: 1, fontFamily: Font.semibold, fontSize: 13, color: Palette.ink, lineHeight: 18 },
  busyLink: { fontFamily: Font.bold, color: Palette.amberDeep, textDecorationLine: 'underline' },
  busyNote: { fontFamily: Font.regular, fontSize: 13, color: Palette.amberDeep, backgroundColor: Palette.amberSoft, borderRadius: Radius.chip, padding: Spacing.md, overflow: 'hidden' },

  // chargers
  charger: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, ...Shadow.soft },
  chargerOff: { backgroundColor: Palette.surfaceAlt },
  chHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  currentBadge: { flexDirection: 'row', gap: 2, height: 42, paddingHorizontal: 10, borderRadius: Radius.chip, alignItems: 'center', justifyContent: 'center' },
  dcBadge: { backgroundColor: Palette.volt },
  acBadge: { backgroundColor: Palette.voltSoft },
  badgeOff: { backgroundColor: Palette.canvasDeep },
  currentText: { fontFamily: Font.display, fontSize: 13, color: Palette.forest },
  serial: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  chMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.voltSofter, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4 },
  onlineRowOff: { backgroundColor: Palette.canvasDeep },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  segRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xs, paddingBottom: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.line },
  segs: { flex: 1, flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  segText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.inkSoft },

  connRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  connDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Palette.lineSoft },
  iconBox: { width: 54, height: 54, borderRadius: 16, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  iconBoxMuted: { backgroundColor: Palette.surfaceAlt },
  connTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  connType: { flexShrink: 1, fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  fitsTag: { fontFamily: Font.bold, fontSize: 10, color: Palette.forest, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  connMeta: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  startOff: { opacity: 0.4 },
  startText: { fontFamily: Font.bold, fontSize: 13, color: Palette.white },
  mineBtn: { backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 9, borderWidth: 1, borderColor: Palette.volt },
  mineText: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest },

  // cards shared by Info / Nearby / Reviews
  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, overflow: 'hidden', ...Shadow.soft },
  cardPad: { padding: Spacing.lg, gap: Spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardTitle: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  infoTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  infoSub: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, lineHeight: 18 },

  // info
  mapBox: { height: 150, backgroundColor: Palette.canvasDeep },
  whereRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  dirBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: 14 },
  infoDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.line },
  infoLabel: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist, width: 86 },
  infoRight: { flex: 1, alignItems: 'flex-end' },
  infoValue: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, textAlign: 'right' },
  typeIcons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm },
  reportText: { flex: 1, fontFamily: Font.semibold, fontSize: 14, color: Palette.red },

  // nearby
  onSiteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  onSite: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, paddingHorizontal: 11, paddingVertical: 7 },
  onSiteText: { fontFamily: Font.semibold, fontSize: 13 },
  // flexGrow 0: a ScrollView grows by default, which stretched the chips when a filter left the list short
  filterScroll: { marginHorizontal: -Spacing.lg, flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, backgroundColor: Palette.surface, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.line, paddingHorizontal: 12 },
  filterOn: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  filterText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  filterTextOn: { color: Palette.white },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  placeIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  placeName: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  placeMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 2 },
  walkBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Palette.brandTint2, alignItems: 'center', justifyContent: 'center' },

  // reviews
  ratingTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  ratingBig: { alignItems: 'center', gap: 3 },
  ratingValue: { fontFamily: Font.display, fontSize: 36, color: Palette.ink, lineHeight: 40 },
  ratingCount: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontFamily: Font.semibold, fontSize: 11, color: Palette.mist, width: 8 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Palette.canvasDeep, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: Palette.amber },
  rateCard: { borderWidth: 1, borderColor: Palette.brandTint2 },
  bigStars: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  starWord: { fontFamily: Font.semibold, fontSize: 14, color: Palette.amberDeep, textAlign: 'center' },
  fieldLabel: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, marginTop: Spacing.sm },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.surface, paddingHorizontal: 11, paddingVertical: 7 },
  tagOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  tagText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  tagTextOn: { color: Palette.white },
  input: { minHeight: 90, borderRadius: 14, borderWidth: 1, borderColor: Palette.line, backgroundColor: Palette.surfaceAlt, padding: Spacing.md, fontFamily: Font.regular, fontSize: 14, color: Palette.ink, textAlignVertical: 'top', marginTop: Spacing.xs },
  formBtns: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  cancelText: { fontFamily: Font.semibold, fontSize: 15, color: Palette.mist },

  review: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.sm, ...Shadow.soft },
  reviewOwn: { borderWidth: 1.5, borderColor: Palette.brandTint2 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  reviewInitial: { fontFamily: Font.bold, fontSize: 14, color: Palette.forest },
  reviewName: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  reviewDate: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  reviewTag: { fontFamily: Font.semibold, fontSize: 11, color: Palette.forest, backgroundColor: Palette.voltSofter, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  reviewText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: Palette.inkSoft },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  editText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },
});
