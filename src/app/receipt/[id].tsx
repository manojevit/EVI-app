import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { formatINR } from '@/data/mock';

/** Receipt for one charging session (after stopping, or from Charging history). */
export default function ReceiptScreen() {
  const router = useRouter();
  const { id, done } = useLocalSearchParams<{ id: string; done?: string }>();
  const rec = useAppStore((st) => st.history.find((h) => h.id === id));

  if (!rec) {
    return (
      <View style={styles.container}>
        <AppHeader back />
        <Text style={styles.missing}>This receipt isn&apos;t available.</Text>
      </View>
    );
  }

  const rate = rec.energyKwh ? rec.costINR / rec.energyKwh : 0;
  const rows: [string, string][] = [
    ['Station', rec.station],
    ['Charger', rec.connectorLabel],
    ['Date', rec.dateLabel],
    ['Energy', `${rec.energyKwh.toFixed(2)} kWh`],
    ['Rate', `₹${rate.toFixed(2)} / kWh`],
    ['Ended', rec.reason],
  ];
  const justStopped = done === '1'; // opened right after stopping a session

  const share = () =>
    Share.share({
      message: `EVIT charging receipt\n${rec.station} · ${rec.connectorLabel}\n${rec.dateLabel}\n${rec.energyKwh.toFixed(2)} kWh · ${formatINR(rec.costINR)}`,
    }).catch(() => {});

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.check}>
            <Ionicons name={justStopped ? 'checkmark' : 'receipt-outline'} size={30} color={Palette.white} />
          </View>
          <Text style={styles.title}>{justStopped ? 'Charging complete' : 'Receipt'}</Text>
          <Text style={styles.total}>{formatINR(rec.costINR)}</Text>
          <Text style={styles.paid}>Paid from your EVIT wallet</Text>
        </View>

        <View style={styles.card}>
          {rows.map(([k, v], i) => (
            <Fragment key={k}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <Text style={styles.key}>{k}</Text>
                <Text style={styles.value} numberOfLines={2}>
                  {v}
                </Text>
              </View>
            </Fragment>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalValue}>{formatINR(rec.costINR)}</Text>
          </View>
        </View>

        <VoltButton label="Share receipt" icon="share-outline" variant="outline" onPress={share} />
        <VoltButton label="Done" onPress={() => (router.canGoBack() ? router.back() : router.replace('/map'))} />
        <Text style={styles.help} onPress={() => router.push('/help')}>
          Something wrong with this charge? <Text style={styles.link}>Get help</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },
  missing: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist, textAlign: 'center', marginTop: 60 },

  head: { alignItems: 'center', paddingVertical: Spacing.lg },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: Palette.volt, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md, ...Shadow.volt },
  title: { fontFamily: Font.displaySemi, fontSize: 18, color: Palette.ink },
  total: { fontFamily: Font.display, fontSize: 34, color: Palette.ink, marginTop: Spacing.xs },
  paid: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, ...Shadow.soft },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.lg, paddingVertical: Spacing.md },
  key: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist },
  value: { flex: 1, fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineSoft },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Palette.line, borderStyle: 'dashed', paddingVertical: Spacing.md, marginTop: Spacing.xs },
  totalKey: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  totalValue: { fontFamily: Font.display, fontSize: 18, color: Palette.forest },

  help: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, textAlign: 'center', marginTop: Spacing.sm },
  link: { fontFamily: Font.semibold, color: Palette.forest },
});
