import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LiveMap, { type LiveMapHandle } from '@/components/live-map';
import StationCard from '@/components/station-card';
import { s, scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { activeFilterCount, setFilters, stationMatches, useAppStore } from '@/data/app-store';
import { STATIONS, distanceKm, freeConnectorCount, maxPowerKw, stationExtras, type Station } from '@/data/mock';
import { useUserLocation } from '@/hooks/use-user-location';

const SORTS = ['Nearest', 'Cheapest', 'Fastest', 'Top rated'] as const;
type Sort = (typeof SORTS)[number];

const GUTTER = 16;
const CARD_GAP = 10;
const CARD_H = 78; // swipe card height incl. border (before scaling)

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const location = useUserLocation();
  const balance = useAppStore((st) => st.walletBalance);
  const filters = useAppStore((st) => st.filters);
  const favourites = useAppStore((st) => st.favourites);
  const [query, setQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [sort, setSort] = useState<Sort>('Nearest');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filterCount = activeFilterCount(filters);
  const mapRef = useRef<LiveMapHandle>(null);
  const cardsRef = useRef<FlatList<Station>>(null);

  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STATIONS.filter((st) => {
      if (!stationMatches(st, filters, favourites)) return false;
      if (!q) return true;
      return st.name.toLowerCase().includes(q) || st.address.toLowerCase().includes(q) || st.city.toLowerCase().includes(q);
    });
  }, [query, filters, favourites]);

  const nearby = useMemo(() => [...matching].sort((a, b) => distanceKm(a, location) - distanceKm(b, location)), [matching, location]);

  const listed = useMemo(() => {
    const by: Record<Sort, (a: Station, b: Station) => number> = {
      Nearest: (a, b) => distanceKm(a, location) - distanceKm(b, location),
      Cheapest: (a, b) => a.pricePerKwh - b.pricePerKwh,
      Fastest: (a, b) => maxPowerKw(b) - maxPowerKw(a),
      'Top rated': (a, b) => stationExtras(b).rating - stationExtras(a).rating,
    };
    return [...matching].sort(by[sort]);
  }, [matching, sort, location]);

  // first view: you + the closest few stations
  const fitNearby = (from: { latitude: number; longitude: number }, list: Station[]): [number, number][] => [
    [from.longitude, from.latitude],
    ...list.slice(0, 3).map((st): [number, number] => [st.longitude, st.latitude]),
  ];

  // when GPS arrives, move the car there and re-fit around it
  const sentFix = useRef(false);
  useEffect(() => {
    if (!location.live) return;
    mapRef.current?.send({ type: 'user', latitude: location.latitude, longitude: location.longitude, fit: sentFix.current ? undefined : fitNearby(location, nearby) });
    sentFix.current = true;
    // only on new fixes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.latitude, location.longitude, location.live]);

  // swipe cards ↔ map pins
  const step = Math.min(width - GUTTER * 2 - 44, s(330)) + CARD_GAP;
  const cardW = step - CARD_GAP;
  const select = (id: string) => {
    setSelectedId(id);
    mapRef.current?.send({ type: 'select', id });
  };
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCardsScroll = (x: number) => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const st = nearby[Math.max(0, Math.min(nearby.length - 1, Math.round(x / step)))];
      if (st && st.id !== selectedId) select(st.id);
    }, 140);
  };
  const onPinPress = (id: string) => {
    const i = nearby.findIndex((st) => st.id === id);
    if (i < 0) return;
    select(id);
    cardsRef.current?.scrollToOffset({ offset: i * step, animated: true });
  };

  const topPad = insets.top + Spacing.sm;
  const tabBarH = Math.max(insets.bottom, Spacing.md) + s(64);
  const cardsBottom = tabBarH + s(10);
  const cardH = s(CARD_H);
  const freePlugs = matching.reduce((n, st) => n + freeConnectorCount(st), 0);

  return (
    <View style={styles.container}>
      {showList ? (
        <FlatList
          data={listed}
          keyExtractor={(st) => st.id}
          renderItem={({ item }) => <StationCard station={item} />}
          contentContainerStyle={{ paddingTop: topPad + s(124), paddingHorizontal: s(GUTTER), paddingBottom: s(150), gap: s(Spacing.md) }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHead}>
              <Text style={styles.count}>
                <Text style={styles.countStrong}>{listed.length}</Text> {listed.length === 1 ? 'station' : 'stations'} ·{' '}
                <Text style={styles.countFree}>{freePlugs} plugs free now</Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sorts}>
                {SORTS.map((o) => (
                  <TouchableOpacity key={o} onPress={() => setSort(o)} activeOpacity={0.85} style={[styles.sort, sort === o && styles.sortOn]}>
                    <Text style={[styles.sortText, sort === o && styles.sortTextOn]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search" size={30} color={Palette.mistLight} />
              <Text style={styles.emptyTitle}>No stations match</Text>
              <Text style={styles.emptyText}>Try another search or turn off a filter.</Text>
            </View>
          }
        />
      ) : (
        <>
          <LiveMap
            ref={mapRef}
            pins={matching.map((st) => ({ id: st.id, latitude: st.latitude, longitude: st.longitude, available: freeConnectorCount(st) > 0, free: freeConnectorCount(st) }))}
            user={location}
            fit={fitNearby(location, nearby)}
            // keep pins clear of the search bar + chips above, the cards + tab bar below and the buttons on the right
            // (+52 on top: padding counts to a pin's tip, and the pin head is ~52pt tall)
            padding={{ top: topPad + s(130) + 52, bottom: cardsBottom + cardH + s(16), left: s(40), right: s(92) }}
            onPinPress={onPinPress}
          />

          {/* nearby stations, swipe sideways */}
          {nearby.length ? (
            <View style={[styles.cardsWrap, { bottom: cardsBottom }]} pointerEvents="box-none">
              <FlatList
                ref={cardsRef}
                horizontal
                data={nearby}
                keyExtractor={(st) => st.id}
                renderItem={({ item }) => <StationCard station={item} compact selected={item.id === selectedId} style={{ width: cardW, height: cardH }} />}
                showsHorizontalScrollIndicator={false}
                snapToInterval={step}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum
                contentContainerStyle={{ paddingHorizontal: s(GUTTER), gap: CARD_GAP, paddingBottom: 6 }}
                onScroll={(e) => onCardsScroll(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={32}
              />
            </View>
          ) : (
            <View style={[styles.noMatch, { bottom: cardsBottom + s(8) }]}>
              <Text style={styles.noMatchText}>No stations match. Try another search or filter.</Text>
            </View>
          )}

          <View style={[styles.fabStack, { bottom: cardsBottom + cardH + s(16) }]} pointerEvents="box-none">
            <TouchableOpacity style={styles.smallFab} activeOpacity={0.85} onPress={() => mapRef.current?.send({ type: 'locate' })} accessibilityLabel="Show my location">
              <Ionicons name="locate" size={22} color={Palette.forest} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrFab} activeOpacity={0.9} onPress={() => router.push('/scan')} accessibilityLabel="Scan to charge">
              <MaterialCommunityIcons name="qrcode-scan" size={26} color={Palette.white} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Floating controls */}
      <View style={[styles.overlay, { paddingTop: topPad }]} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={20} color={Palette.mist} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search location"
              placeholderTextColor={Palette.mistLight}
              style={styles.input}
            />
          </View>
          <CircleBtn icon="options-outline" badge={filterCount} onPress={() => router.push('/filters')} />
          <CircleBtn icon="notifications-outline" onPress={() => router.push('/notifications')} />
        </View>

        <View style={styles.chipRow}>
          <Chip label="Available" active={filters.availableNow} onPress={() => setFilters({ availableNow: !filters.availableNow })} />
          <Chip label="DC fast" active={filters.category === 'DC'} onPress={() => setFilters({ category: filters.category === 'DC' ? null : 'DC' })} />
          <TouchableOpacity style={styles.wallet} activeOpacity={0.85} onPress={() => router.push('/wallet')}>
            <Ionicons name="wallet" size={15} color={Palette.forest} />
            <Text style={styles.walletText} numberOfLines={1}>
              {/* short form on narrow phones so the chip row never clips */}
              {width < 360 && balance >= 10000 ? `₹${(balance / 1000).toFixed(1)}k` : `₹${Math.floor(balance).toLocaleString('en-IN')}`}
            </Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.toggle} activeOpacity={0.85} onPress={() => setShowList((v) => !v)} accessibilityLabel={showList ? 'Show map' : 'Show list'}>
            <Ionicons name={showList ? 'map' : 'list'} size={20} color={Palette.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function CircleBtn({ icon, onPress, badge }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; badge?: number }) {
  return (
    <TouchableOpacity style={styles.circle} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={22} color={Palette.forest} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.85}>
      {active ? <Ionicons name="checkmark" size={15} color={Palette.white} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: GUTTER, gap: Spacing.md },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    height: 52,
    ...Shadow.soft,
  },
  input: { flex: 1, minWidth: 0, fontFamily: Font.medium, fontSize: 16, color: Palette.ink, padding: 0 },
  circle: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    ...Shadow.soft,
  },
  chipActive: { backgroundColor: Palette.forest },
  chipText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  chipTextActive: { color: Palette.white },
  wallet: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Shadow.soft,
  },
  walletText: { fontFamily: Font.bold, fontSize: 14, color: Palette.forestDeep },
  toggle: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },

  badge: { position: 'absolute', top: 6, right: 6, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: Palette.amber, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontFamily: Font.bold, fontSize: 10, color: Palette.white },

  listHead: { gap: Spacing.md, marginBottom: Spacing.xs },
  count: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist },
  countStrong: { fontFamily: Font.bold, color: Palette.ink },
  countFree: { fontFamily: Font.semibold, color: Palette.forest },
  sorts: { gap: Spacing.sm },
  sort: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  sortOn: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  sortText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  sortTextOn: { color: Palette.white },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 60 },
  emptyTitle: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  emptyText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist },

  cardsWrap: { position: 'absolute', left: 0, right: 0 },
  noMatch: { position: 'absolute', left: GUTTER, right: GUTTER, backgroundColor: Palette.surface, borderRadius: Radius.chip, padding: Spacing.md, alignItems: 'center', ...Shadow.soft },
  noMatchText: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },

  fabStack: { position: 'absolute', right: GUTTER, gap: Spacing.sm, alignItems: 'center' },
  smallFab: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lift,
  },
  qrFab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.volt,
  },
});
