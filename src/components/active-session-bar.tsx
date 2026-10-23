import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniBars } from '@/components/energy-bars';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { MINI_SESSION } from '@/data/mock';

/**
 * Floating "charging now" strip — a light card with a green live accent.
 * Pass `aboveTabBar` on tabbed screens so it clears the floating tab bar.
 */
export default function ActiveSessionBar({ aboveTabBar }: { aboveTabBar?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + (aboveTabBar ? 92 : Spacing.lg);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/sessions')} style={[styles.bar, { bottom }]}>
      <View style={styles.iconWrap}>
        <MiniBars color={Palette.volt} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.live}>Charging now</Text>
        </View>
        <Text style={styles.name}>{MINI_SESSION.stationName}</Text>
      </View>
      <Text style={styles.kwh}>{MINI_SESSION.energyKwh.toFixed(2)} kWh</Text>
      <Ionicons name="chevron-forward" size={18} color={Palette.mist} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.volt },
  live: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  name: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink, marginTop: 1 },
  kwh: { fontFamily: Font.display, fontSize: 15, color: Palette.forest },
});
