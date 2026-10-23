import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import { MiniBars } from '@/components/energy-bars';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { CANCELLED_SESSIONS, formatINR } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

const MONTHS = ['Oct 2026', 'Sep 2026', 'Aug 2026', 'Jul 2026'];

export default function HistoryScreen() {
  const router = useRouter();
  const history = useAppStore((st) => st.history);
  const totalKwh = history.reduce((n, r) => n + r.energyKwh, 0);
  const totalINR = history.reduce((n, r) => n + r.costINR, 0);
  const [month, setMonth] = useState('Oct 2026');
  const [tab, setTab] = useState<'completed' | 'cancelled'>('completed');
  const hasData = month === 'Oct 2026'; // only the current month is populated

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} stickyHeaderIndices={[]}>
        <Text style={styles.title}>Charging history</Text>

        {/* month filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>
          {MONTHS.map((m) => (
            <TouchableOpacity key={m} style={[styles.month, month === m && styles.monthOn]} onPress={() => setMonth(m)} activeOpacity={0.85}>
              <Text style={[styles.monthText, month === m && styles.monthTextOn]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* dark summary */}
        <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
          <View style={styles.sumItem}>
            <Text style={styles.sumLabel}>ENERGY</Text>
            <Text style={styles.sumValue}>{hasData ? totalKwh.toFixed(2) : 0} kWh</Text>
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumItem}>
            <Text style={styles.sumLabel}>SPENT</Text>
            <Text style={styles.sumValue}>{formatINR(hasData ? totalINR : 0)}</Text>
          </View>
          <MiniBars color={Palette.volt} />
        </LinearGradient>

        {/* segment */}
        <View style={styles.segment}>
          <Seg label="Completed" active={tab === 'completed'} onPress={() => setTab('completed')} />
          <Seg label="Cancelled" active={tab === 'cancelled'} onPress={() => setTab('cancelled')} />
        </View>

        {!hasData ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={34} color={Palette.mistLight} />
            <Text style={styles.emptyText}>No sessions in {month}</Text>
          </View>
        ) : tab === 'completed' ? (
          history.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.top}>
                <View style={styles.iconChip}>
                  <Ionicons name="flash" size={19} color={Palette.forest} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.station}>{r.station}</Text>
                  <Text style={styles.sub}>{r.dateLabel}</Text>
                  <Text style={styles.sub}>{r.connectorLabel}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                  <Text style={styles.cost}>{formatINR(r.costINR)}</Text>
                  <Text style={styles.kwh}>{r.energyKwh} kWh</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.bottom}>
                <Text style={styles.reason}>{r.reason}</Text>
                <TouchableOpacity style={styles.receipt} activeOpacity={0.8} onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: r.id } })}>
                  <Ionicons name="receipt-outline" size={16} color={Palette.forest} />
                  <Text style={styles.receiptText}>Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          CANCELLED_SESSIONS.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.top}>
                <View style={[styles.iconChip, { backgroundColor: Palette.redSoft }]}>
                  <Ionicons name="close" size={19} color={Palette.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.station} numberOfLines={1}>{r.ref}</Text>
                  <Text style={styles.sub}>Connector —</Text>
                </View>
                <View style={styles.cancelBadge}><Text style={styles.cancelText}>Cancelled</Text></View>
              </View>
              <View style={styles.divider} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={15} color={Palette.red} />
                <Text style={styles.expired}>{r.expiredLabel}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Seg({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.seg, active && styles.segOn]} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.segText, active && styles.segTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },

  months: { gap: Spacing.sm, paddingVertical: 2 },
  month: { paddingHorizontal: Spacing.lg, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Palette.surface, ...Shadow.soft },
  monthOn: { backgroundColor: Palette.forest },
  monthText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.inkSoft },
  monthTextOn: { color: Palette.white },

  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, borderRadius: Radius.card, padding: Spacing.xl, borderWidth: 1, borderColor: Palette.brandTint2, ...Shadow.soft },
  sumItem: { gap: 4 },
  sumLabel: { fontFamily: Font.bold, fontSize: 10, letterSpacing: 1, color: Palette.mist },
  sumValue: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  sumDivider: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: Palette.brandTint2 },

  segment: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 5 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.pill },
  segOn: { backgroundColor: Palette.surface, ...Shadow.soft },
  segText: { fontFamily: Font.semibold, fontSize: 15, color: Palette.mist },
  segTextOn: { color: Palette.forest },

  empty: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.huge },
  emptyText: { fontFamily: Font.medium, fontSize: 16, color: Palette.mist },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, ...Shadow.soft },
  top: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  iconChip: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  station: { fontFamily: Font.displaySemi, fontSize: 17, color: Palette.ink },
  sub: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },
  cost: { fontFamily: Font.display, fontSize: 18, color: Palette.ink },
  kwh: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineSoft, marginVertical: Spacing.md },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reason: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist },
  receipt: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 8 },
  receiptText: { fontFamily: Font.bold, fontSize: 14, color: Palette.forest },
  cancelBadge: { backgroundColor: Palette.redSoft, borderRadius: Radius.pill, paddingHorizontal: 11, paddingVertical: 5 },
  cancelText: { fontFamily: Font.bold, fontSize: 13, color: Palette.red },
  expired: { fontFamily: Font.semibold, fontSize: 14, color: Palette.red },
});
