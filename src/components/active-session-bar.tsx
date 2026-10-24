import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniBars } from '@/components/energy-bars';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { sessionParts, sessionReadout, useAppStore } from '@/data/app-store';
import { useNow } from '@/hooks/use-now';

/**
 * Floating "charging now" strip, shown only while a session is running.
 */
export default function ActiveSessionBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAppStore((st) => st.session);
  const now = useNow(2000);
  if (!session) return null;

  const { station } = sessionParts(session);
  const r = sessionReadout(session, now);
  const bottom = insets.bottom + Spacing.lg;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => router.navigate('/sessions')} style={[styles.bar, { bottom }]}>
      <View style={styles.iconWrap}>
        <MiniBars color={Palette.volt} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, r.full && { backgroundColor: Palette.forest }]} />
          <Text style={styles.live}>{r.full ? 'Charge complete' : 'Charging now'}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {station.name}
        </Text>
      </View>
      <Text style={styles.kwh}>{r.energyKwh.toFixed(2)} kWh</Text>
      <Ionicons name="chevron-forward" size={18} color={Palette.mist} />
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  bar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadow.lift,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.volt },
  live: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  name: { fontFamily: Font.displaySemi, fontSize: 15, color: Palette.ink, marginTop: 1 },
  kwh: { fontFamily: Font.display, fontSize: 14, color: Palette.forest },
});
