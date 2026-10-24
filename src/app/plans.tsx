import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { subscribePlan, useAppStore } from '@/data/app-store';
import { PLANS, formatINR } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

// pay-as-you-go tops out at ₹12/kWh, so a plan's saving is what its kWh would cost at that rate
const PAYG_MAX = 12;
// only what sets a plan apart; kWh and savings are worked out from the plan itself
const EXTRAS: Record<string, string[]> = {
  plus: ['Priority on AC and DC fast chargers'],
};
const features = (p: { id: string; priceINR: number; kwh: number }) => [
  `${p.kwh} kWh every month`,
  `Save up to ₹${p.kwh * PAYG_MAX - p.priceINR} a month`,
  ...(EXTRAS[p.id] ?? []),
];

export default function PlansScreen() {
  const router = useRouter();
  const planId = useAppStore((st) => st.planId);
  const balance = useAppStore((st) => st.walletBalance);
  const [lowFor, setLowFor] = useState<string | null>(null);
  const current = PLANS.find((p) => p.id === planId);

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose a plan</Text>
        <Text style={styles.subtitle}>{current ? `You're on ${current.name}. Switch anytime.` : 'Save on every charge. Cancel anytime.'}</Text>

        {PLANS.map((p, i) => {
          const featured = i === 1;
          const perKwh = p.priceINR / p.kwh;
          const body = (
            <>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{p.name}</Text>
                {featured ? (
                  <View style={styles.tag}>
                    <Ionicons name="star" size={11} color={Palette.white} />
                    <Text style={styles.tagText}>Most popular</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{p.priceINR}</Text>
                <Text style={styles.period}>/ month</Text>
              </View>
              <Text style={styles.perKwh}>Works out to ₹{perKwh.toFixed(2)} per kWh</Text>
              <View style={styles.divider} />
              {features(p).map((f) => (
                <View key={f} style={styles.feat}>
                  <Ionicons name="checkmark-circle" size={19} color={Palette.volt} />
                  <Text style={styles.featText}>{f}</Text>
                </View>
              ))}
              {planId === p.id ? (
                <View style={styles.current}>
                  <Ionicons name="checkmark-circle" size={18} color={Palette.forest} />
                  <Text style={styles.currentText}>Your current plan</Text>
                </View>
              ) : (
                <VoltButton
                  label={`Get ${p.name} · ₹${p.priceINR}`}
                  variant={featured ? 'forest' : 'outline'}
                  onPress={() => setLowFor(subscribePlan(p) ? null : p.id)}
                  style={{ marginTop: Spacing.lg }}
                />
              )}
              {lowFor === p.id ? (
                <Text style={styles.low} onPress={() => router.push('/wallet')}>
                  Your wallet has {formatINR(balance)}. <Text style={styles.lowLink}>Add money</Text> to get this plan.
                </Text>
              ) : null}
            </>
          );
          return featured ? (
            <LinearGradient key={p.id} colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.card, styles.featured]}>
              {body}
            </LinearGradient>
          ) : (
            <View key={p.id} style={styles.card}>
              {body}
            </View>
          );
        })}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={Palette.mist} />
          <Text style={styles.noteText}>{current ? 'Plans are paid from your wallet each month.' : 'You’re on pay-as-you-go at ₹9–12 per kWh. A plan pays off from about 20 kWh a month.'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.lg, paddingBottom: 48 },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, marginTop: -Spacing.sm },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Palette.line, ...Shadow.soft },
  current: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.lg, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingVertical: 12 },
  currentText: { fontFamily: Font.bold, fontSize: 14, color: Palette.forest },
  low: { fontFamily: Font.regular, fontSize: 13, color: Palette.red, textAlign: 'center', marginTop: Spacing.sm },
  lowLink: { fontFamily: Font.bold, color: Palette.forest },
  featured: { borderWidth: 2, borderColor: Palette.volt, ...Shadow.lift },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  tagText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
  name: { fontFamily: Font.display, fontSize: 19, color: Palette.ink },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: Spacing.sm },
  price: { fontFamily: Font.display, fontSize: 28, color: Palette.forest },
  period: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist },
  perKwh: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.line, marginVertical: Spacing.lg },
  feat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 5 },
  featText: { fontFamily: Font.medium, fontSize: 14, color: Palette.inkSoft },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.chip, padding: Spacing.lg },
  noteText: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.mist, lineHeight: 20 },
});
