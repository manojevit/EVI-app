import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { CATEGORIES, CONNECTOR_TYPES } from '@/data/mock';

export default function FiltersSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [favourites, setFavourites] = useState(false);
  const [availableNow, setAvailableNow] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [category, setCategory] = useState<string | null>('DC');
  const [types, setTypes] = useState<string[]>(['CCS (DC)']);

  const toggleType = (t: string) => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.grabber} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Text style={styles.title}>Filters</Text>

          <Text style={styles.section}>Availability</Text>
          <Toggle title="Favourites only" subtitle="Show only stations you've saved" value={favourites} onValueChange={setFavourites} />
          <Toggle title="Available now" subtitle="Has a connector free to start right now" value={availableNow} onValueChange={setAvailableNow} />
          <Toggle title="Active stations" subtitle="Currently operating" value={activeOnly} onValueChange={setActiveOnly} />

          <Text style={styles.section}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
            ))}
          </View>

          <Text style={styles.section}>Connector type</Text>
          <View style={styles.chipRow}>
            {CONNECTOR_TYPES.map((t) => (
              <Chip key={t} label={t} selected={types.includes(t)} onPress={() => toggleType(t)} />
            ))}
          </View>
        </ScrollView>

        <VoltButton label="Show results" onPress={() => router.back()} style={{ marginTop: Spacing.sm }} />
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

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,24,15,0.5)' },
  sheet: { backgroundColor: Palette.canvas, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: '88%' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Palette.line, marginBottom: Spacing.sm },
  body: { paddingBottom: Spacing.lg },
  title: { fontFamily: Font.display, fontSize: 30, color: Palette.ink, marginVertical: Spacing.sm },
  section: { fontFamily: Font.bold, fontSize: 13, letterSpacing: 1, color: Palette.mist, marginTop: Spacing.xl, marginBottom: Spacing.sm },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  toggleTitle: { fontFamily: Font.semibold, fontSize: 18, color: Palette.ink },
  toggleSub: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, marginTop: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface },
  chipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  chipText: { fontFamily: Font.semibold, fontSize: 15, color: Palette.inkSoft },
  chipTextOn: { color: Palette.white },
});
