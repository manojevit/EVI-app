import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { NO_FILTERS, getAppState, setFilters, stationMatches, useAppStore, type MapFilters } from '@/data/app-store';
import { CONNECTORS, CONNECTOR_KEYS } from '@/data/connectors';
import { STATIONS } from '@/data/mock';

/** Map filters. Edits a draft; "Show results" applies it to the map and list. */
export default function FiltersSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const favourites = useAppStore((st) => st.favourites);
  const [draft, setDraft] = useState<MapFilters>(() => getAppState().filters);
  const patch = (p: Partial<MapFilters>) => setDraft((d) => ({ ...d, ...p }));
  const toggleType = (k: (typeof CONNECTOR_KEYS)[number]) =>
    patch({ types: draft.types.includes(k) ? draft.types.filter((x) => x !== k) : [...draft.types, k] });

  const matches = STATIONS.filter((s) => stationMatches(s, draft, favourites)).length;
  const apply = () => {
    setFilters(draft);
    router.back();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={() => setDraft(NO_FILTERS)} hitSlop={10}>
            <Text style={styles.reset}>Reset</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Text style={styles.section}>Availability</Text>
          <Toggle title="Available now" subtitle="Has a connector free to start right now" value={draft.availableNow} onValueChange={(v) => patch({ availableNow: v })} />
          <Toggle title="Saved stations only" subtitle="Stations you've starred" value={draft.favouritesOnly} onValueChange={(v) => patch({ favouritesOnly: v })} />
          <Toggle title="Active stations" subtitle="Currently operating" value={draft.activeOnly} onValueChange={(v) => patch({ activeOnly: v })} />

          <Text style={styles.section}>Charger type</Text>
          <View style={styles.chipRow}>
            {(['AC', 'DC'] as const).map((c) => (
              <Chip key={c} label={c === 'DC' ? 'DC fast' : 'AC'} selected={draft.category === c} onPress={() => patch({ category: draft.category === c ? null : c })} />
            ))}
          </View>

          <Text style={styles.section}>Connector</Text>
          <View style={styles.chipRow}>
            {CONNECTOR_KEYS.map((k) => (
              <Chip key={k} label={CONNECTORS[k].label} selected={draft.types.includes(k)} onPress={() => toggleType(k)} />
            ))}
          </View>
        </ScrollView>

        <VoltButton
          label={matches ? `Show ${matches} ${matches === 1 ? 'station' : 'stations'}` : 'No stations match'}
          disabled={!matches}
          onPress={apply}
          style={{ marginTop: Spacing.sm }}
        />
      </View>
    </View>
  );
}

function Toggle({ title, subtitle, value, onValueChange }: { title: string; subtitle: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, paddingRight: Spacing.lg }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#CBD4C8', true: Palette.volt }} thumbColor={Palette.white} ios_backgroundColor="#CBD4C8" />
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,24,15,0.5)' },
  sheet: { backgroundColor: Palette.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: '88%' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Palette.line, marginBottom: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: Spacing.xs },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  reset: { fontFamily: Font.semibold, fontSize: 14, color: Palette.forest },
  body: { paddingBottom: Spacing.lg },
  section: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginTop: Spacing.lg, marginBottom: Spacing.xs },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  toggleTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  toggleSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface },
  chipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  chipTextOn: { color: Palette.white },
});
