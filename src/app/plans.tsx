import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { PLANS } from '@/data/mock';

const FEATURES: Record<string, string[]> = {
  lite: ['20 kWh included every month', 'Works at all EVIT chargers', 'In-app support'],
  plus: ['60 kWh included every month', 'Priority AC + DC charging', 'All chargers and faster support'],
};

export default function PlansScreen() {
  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose a plan</Text>
        <Text style={styles.subtitle}>Save on every charge. Cancel anytime.</Text>

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
              {(FEATURES[p.id] ?? []).map((f) => (
                <View key={f} style={styles.feat}>
                  <Ionicons name="checkmark-circle" size={19} color={Palette.volt} />
                  <Text style={styles.featText}>{f}</Text>
                </View>
              ))}
              <VoltButton label={`Get ${p.name}`} variant={featured ? 'forest' : 'outline'} style={{ marginTop: Spacing.lg }} />
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
          <Text style={styles.noteText}>You&apos;re on pay-as-you-go at ₹10–12 per kWh. A plan pays off from about 20 kWh a month.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 48 },
  title: { fontFamily: Font.display, fontSize: 26, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist, marginTop: -Spacing.sm },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.xl, borderWidth: 1, borderColor: Palette.line, ...Shadow.soft },
  featured: { borderWidth: 2, borderColor: Palette.volt, ...Shadow.lift },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  tagText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
  name: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: Spacing.sm },
  price: { fontFamily: Font.display, fontSize: 34, color: Palette.forest },
  period: { fontFamily: Font.medium, fontSize: 15, color: Palette.mist },
  perKwh: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.line, marginVertical: Spacing.lg },
  feat: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 5 },
  featText: { fontFamily: Font.medium, fontSize: 15, color: Palette.inkSoft },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.chip, padding: Spacing.lg },
  noteText: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.mist, lineHeight: 20 },
});
