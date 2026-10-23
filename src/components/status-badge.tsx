import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Font, Palette, Radius } from '@/constants/theme';
import { scaledSheet } from '@/constants/responsive';

type Tone = 'available' | 'unavailable' | 'offline' | 'active' | 'charging';

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  available: { bg: Palette.voltSoft, fg: Palette.forestDeep, dot: Palette.volt },
  active: { bg: 'rgba(255,255,255,0.92)', fg: Palette.forestDeep, dot: Palette.volt },
  charging: { bg: Palette.voltSoft, fg: Palette.forestDeep, dot: Palette.volt },
  unavailable: { bg: '#ECEFEA', fg: Palette.mist, dot: Palette.mistLight },
  offline: { bg: '#ECEFEA', fg: Palette.mist, dot: Palette.mistLight },
};

export default function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <View style={[styles.dot, { backgroundColor: t.dot }]} />
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = scaledSheet({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  label: { fontFamily: Font.semibold, fontSize: 13 },
});
