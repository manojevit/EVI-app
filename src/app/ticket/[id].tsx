import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import AppHeader from '@/components/app-header';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { SUPPORT_CONTACT } from '@/data/mock';

/** One ticket: what was reported and where it stands. */
export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useAppStore((st) => st.tickets.find((x) => x.id === id));

  if (!t) {
    return (
      <View style={styles.container}>
        <AppHeader back />
        <Text style={styles.missing}>This ticket isn&apos;t available.</Text>
      </View>
    );
  }

  const steps = [
    { label: 'Ticket raised', note: t.dateLabel, done: true },
    { label: 'With our support team', note: 'We’ll contact you by phone or email', done: t.status === 'Open' },
    { label: 'Resolved', note: 'You’ll get a message when it’s closed', done: t.status !== 'Open' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>{t.status}</Text>
        </View>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.meta}>
          {t.priority} · Ticket {t.id.toUpperCase()}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Details</Text>
          <Text style={styles.body}>{t.body}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          {steps.map((s, i) => (
            <View key={s.label} style={styles.step}>
              <View style={styles.stepRail}>
                <View style={[styles.stepDot, s.done && styles.stepDotOn]}>
                  {s.done ? <Ionicons name="checkmark" size={11} color={Palette.white} /> : null}
                </View>
                {i < steps.length - 1 ? <View style={styles.stepLine} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: Spacing.md }}>
                <Text style={[styles.stepLabel, !s.done && { color: Palette.mist }]}>{s.label}</Text>
                <Text style={styles.stepNote}>{s.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.foot}>
          Need to add something? Call {SUPPORT_CONTACT.phone} or email {SUPPORT_CONTACT.email} and quote ticket {t.id.toUpperCase()}.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.md },
  missing: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist, textAlign: 'center', marginTop: 60 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.volt },
  badgeText: { fontFamily: Font.bold, fontSize: 12, color: Palette.forest },
  title: { fontFamily: Font.display, fontSize: 21, color: Palette.ink },
  meta: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: -Spacing.sm },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.sm, ...Shadow.soft },
  label: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist },
  body: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: Palette.ink },

  step: { flexDirection: 'row', gap: Spacing.md },
  stepRail: { alignItems: 'center', width: 18 },
  stepDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Palette.line, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  stepDotOn: { backgroundColor: Palette.volt, borderColor: Palette.volt },
  stepLine: { flex: 1, width: 2, backgroundColor: Palette.line, marginVertical: 2 },
  stepLabel: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  stepNote: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },

  foot: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19, color: Palette.mist, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
