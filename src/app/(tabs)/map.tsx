import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StationCard from '@/components/station-card';
import StationMap from '@/components/station-map';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { ACCOUNT, STATIONS } from '@/data/mock';
import { s, scaledSheet } from '@/constants/responsive';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showList, setShowList] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  const stations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STATIONS.filter((s) => {
      if (availableOnly && s.status !== 'Available') return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    });
  }, [query, availableOnly]);

  const topPad = insets.top + Spacing.sm;

  return (
    <View style={styles.container}>
      {showList ? (
        <FlatList
          data={stations}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <StationCard station={item} />}
          contentContainerStyle={{ paddingTop: topPad + s(128), paddingHorizontal: s(Spacing.lg), paddingBottom: s(140), gap: Spacing.md }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <StationMap stations={stations} />
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
          <CircleBtn icon="options-outline" onPress={() => router.push('/filters')} />
          <CircleBtn icon="notifications-outline" onPress={() => router.push('/notifications')} />
        </View>

        <View style={styles.chipRow}>
          <Chip label="Available" active={availableOnly} onPress={() => setAvailableOnly((v) => !v)} />
          <Chip label="Nearby" onPress={() => {}} />
          <TouchableOpacity style={styles.wallet} activeOpacity={0.85} onPress={() => router.push('/wallet')}>
            <Ionicons name="wallet" size={16} color={Palette.forest} />
            <Text style={styles.walletText}>₹{ACCOUNT.walletBalance.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.toggle} activeOpacity={0.85} onPress={() => setShowList((v) => !v)}>
            <Ionicons name={showList ? 'map' : 'list'} size={20} color={Palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action stack */}
      <View style={[styles.fabStack, { bottom: insets.bottom + 110 }]} pointerEvents="box-none">
        {!showList ? (
          <TouchableOpacity style={styles.smallFab} activeOpacity={0.85} onPress={() => {}}>
            <Ionicons name="locate" size={22} color={Palette.forest} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.qrFab} activeOpacity={0.9} onPress={() => router.push('/scan')}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color={Palette.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CircleBtn({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.circle} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={22} color={Palette.forest} />
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
