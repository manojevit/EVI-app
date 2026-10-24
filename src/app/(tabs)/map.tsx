import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StationCard from '@/components/station-card';
import LiveMap from '@/components/live-map';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { activeFilterCount, setFilters, stationMatches, useAppStore } from '@/data/app-store';
import { STATIONS, distanceKm, freeConnectorCount, maxPowerKw, stationExtras } from '@/data/mock';
import { s, scaledSheet } from '@/constants/responsive';

const SORTS = ['Nearest', 'Cheapest', 'Fastest', 'Top rated'] as const;
type Sort = (typeof SORTS)[number];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const balance = useAppStore((st) => st.walletBalance);
  const filters = useAppStore((st) => st.filters);
  const favourites = useAppStore((st) => st.favourites);
  const [query, setQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [sort, setSort] = useState<Sort>('Nearest');
  const [recenter, setRecenter] = useState(0); // bump to re-fit the map to the stations
  const filterCount = activeFilterCount(filters);

  const stations = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = STATIONS.filter((st) => {
      if (!stationMatches(st, filters, favourites)) return false;
      if (!q) return true;
      return st.name.toLowerCase().includes(q) || st.address.toLowerCase().includes(q) || st.city.toLowerCase().includes(q);
    });
    const by: Record<Sort, (a: (typeof STATIONS)[number], b: (typeof STATIONS)[number]) => number> = {
      Nearest: (a, b) => distanceKm(a) - distanceKm(b),
      Cheapest: (a, b) => a.pricePerKwh - b.pricePerKwh,
      Fastest: (a, b) => maxPowerKw(b) - maxPowerKw(a),
      'Top rated': (a, b) => stationExtras(b).rating - stationExtras(a).rating,
    };
    return [...list].sort(by[sort]);
  }, [query, filters, favourites, sort]);

  const freePlugs = stations.reduce((n, st) => n + freeConnectorCount(st), 0);
  const fastest = stations.reduce((m, st) => Math.max(m, maxPowerKw(st)), 0);
  const topPad = insets.top + Spacing.sm;

  return (
    <View style={styles.container}>
      {showList ? (
        <FlatList
          data={stations}
          keyExtractor={(st) => st.id}
          renderItem={({ item, index }) => <StationCard station={item} index={index} />}
          contentContainerStyle={{ paddingTop: topPad + s(124), paddingHorizontal: s(Spacing.lg), paddingBottom: s(150), gap: s(Spacing.lg) }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHead}>
              <View style={styles.summary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{stations.length}</Text>
                  <Text style={styles.summaryLabel}>{stations.length === 1 ? 'station' : 'stations'}</Text>
                </View>
                <View style={styles.summaryLine} />
                <View style={styles.summaryItem}>
                  <View style={styles.liveRow}>
                    <View style={styles.liveDot} />
                    <Text style={styles.summaryValue}>{freePlugs}</Text>
                  </View>
                  <Text style={styles.summaryLabel}>plugs free now</Text>
                </View>
                <View style={styles.summaryLine} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{fastest} kW</Text>
                  <Text style={styles.summaryLabel}>fastest</Text>
                </View>
              </View>
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
        <LiveMap
          key={recenter}
          pins={stations.map((st) => ({ id: st.id, latitude: st.latitude, longitude: st.longitude, available: st.status === 'Available' }))}
          // keep pins clear of the search bar + chips above and the tab bar below
          // (+46 on top: padding counts to a pin's tip, and the logo pin is 46pt tall)
          padding={{ top: topPad + s(150) + 46, bottom: s(130), left: s(46), right: s(46) }}
          onPinPress={(id) => router.push(`/station/${id}`)}
        />
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
            <Text style={styles.walletText}>₹{Math.floor(balance).toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.toggle} activeOpacity={0.85} onPress={() => setShowList((v) => !v)} accessibilityLabel={showList ? 'Show map' : 'Show list'}>
            <Ionicons name={showList ? 'map' : 'list'} size={20} color={Palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action stack (map view only, so it never covers list cards) */}
      {!showList ? (
        <View style={[styles.fabStack, { bottom: insets.bottom + 110 }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.smallFab} activeOpacity={0.85} onPress={() => setRecenter((n) => n + 1)} accessibilityLabel="Show all stations">
            <Ionicons name="locate" size={22} color={Palette.forest} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrFab} activeOpacity={0.9} onPress={() => router.push('/scan')} accessibilityLabel="Scan to charge">
            <MaterialCommunityIcons name="qrcode-scan" size={28} color={Palette.white} />
          </TouchableOpacity>
        </View>
      ) : null}
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
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, gap: Spacing.md },

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
  input: { flex: 1, fontFamily: Font.medium, fontSize: 16, color: Palette.ink, padding: 0 },
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
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface, borderRadius: Radius.card, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Palette.brandTint2, ...Shadow.soft },
  summaryItem: { flex: 1, alignItems: 'center', gap: 1 },
  summaryValue: { fontFamily: Font.display, fontSize: 19, color: Palette.ink },
  summaryLabel: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  summaryLine: { width: 1, height: 30, backgroundColor: Palette.line },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  sorts: { gap: Spacing.sm },
  sort: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  sortOn: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  sortText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  sortTextOn: { color: Palette.white },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 60 },
  emptyTitle: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  emptyText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist },

  fabStack: { position: 'absolute', right: 20, gap: Spacing.md, alignItems: 'center' },
  smallFab: {
    width: 50,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lift,
  },
  qrFab: {
    width: 62,
    height: 62,
    borderRadius: Radius.card,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.volt,
  },
});
