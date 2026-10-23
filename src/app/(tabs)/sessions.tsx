import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppHeader from '@/components/app-header';
import ChargeRing from '@/components/charge-ring';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { ACTIVE_SESSION, formatINR } from '@/data/mock';

const BATTERY_PCT = 62;
const TARGET_PCT = 80;
const MIN_TO_TARGET = 45;

/** Small dot that pulses to signal a live reading. */
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={[styles.liveDot, { opacity: pulse }]} />;
}

export default function SessionsScreen() {
  const router = useRouter();
  const s = ACTIVE_SESSION;

  return (
    <View style={styles.container}>
      <AppHeader rightIcon="receipt-outline" onRightPress={() => router.push('/history')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* hero */}
        <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.statusPill}>
              <LiveDot />
              <Text style={styles.statusText}>Charging</Text>
            </View>
            <View style={styles.battery}>
              <Ionicons name="battery-half" size={18} color={Palette.forest} />
              <Text style={styles.batteryText}>{BATTERY_PCT}%</Text>
            </View>
          </View>

          <View style={styles.ringWrap}>
            <ChargeRing size={232} progress={BATTERY_PCT / 100} strokeWidth={16} trackColor={Palette.voltSoft}>
              <Text style={styles.mode}>AC charging</Text>
              <Text style={styles.power}>{s.powerKw}</Text>
              <Text style={styles.unit}>kW</Text>
            </ChargeRing>
          </View>

          <View style={styles.eta}>
            <Ionicons name="time-outline" size={16} color={Palette.forest} />
            <Text style={styles.etaText}>
              {TARGET_PCT}% in about <Text style={styles.etaStrong}>{MIN_TO_TARGET} min</Text>
            </Text>
          </View>

          <View style={styles.stationRow}>
            <MaterialCommunityIcons name="ev-station" size={17} color={Palette.mist} />
            <Text style={styles.station}>{s.stationName}</Text>
            <Text style={styles.connector}>· {s.connectorLabel}</Text>
          </View>
        </LinearGradient>

        {/* live stats */}
        <View style={styles.grid}>
          <Tile icon="flash" label="Power now" value={`${s.powerKw}`} unit="kW" live />
          <Tile icon="battery-charging" label="Energy added" value={`${s.energyKwh}`} unit="kWh" />
          <Tile icon="cash-outline" label="Cost so far" value={formatINR(s.costINR)} note="₹10/kWh" />
          <Tile icon="time" label="Charging for" value={s.duration} />
        </View>

        <VoltButton label="Stop charging" icon="stop" variant="danger" style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </View>
  );
}

function Tile({
  icon,
  label,
  value,
  unit,
  note,
  live,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  note?: string;
  live?: boolean;
}) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileTop}>
        <View style={styles.tileIcon}>
          <Ionicons name={icon} size={16} color={Palette.forest} />
        </View>
        {live ? (
          <View style={styles.liveTag}>
            <LiveDot />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tileValue}>
        {value}
        {unit ? <Text style={styles.tileUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.tileLabel}>{note ? `${label} · ${note}` : label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 130, gap: Spacing.md },

  hero: {
    borderRadius: Radius.hero,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    ...Shadow.soft,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: Palette.brandTint2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  statusText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },
  battery: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  batteryText: { fontFamily: Font.display, fontSize: 17, color: Palette.ink },

  ringWrap: { marginTop: Spacing.md },
  mode: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },
  power: { fontFamily: Font.display, fontSize: 60, color: Palette.ink, lineHeight: 66 },
  unit: { fontFamily: Font.semibold, fontSize: 15, color: Palette.mist, marginTop: -4 },

  eta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 8, marginTop: Spacing.lg },
  etaText: { fontFamily: Font.medium, fontSize: 14, color: Palette.inkSoft },
  etaStrong: { fontFamily: Font.bold, color: Palette.forest },

  stationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.md },
  station: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  connector: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: { width: '48.2%', flexGrow: 1, backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: 6, ...Shadow.soft },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  tileIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  tileValue: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  tileUnit: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist },
  tileLabel: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },
});
