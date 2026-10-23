import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { TICKETS } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

// short session ref from the mock body, for a readable tag
function sessionRef(body: string) {
  const m = body.match(/session ([0-9a-f]{8})/i);
  return m ? `#${m[1]}` : '';
}

export default function SupportScreen() {
  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.intro}>Your recent requests are below. Our team follows up by phone or email — there&apos;s no live chat.</Text>

        {TICKETS.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.top}>
              <View style={styles.iconChip}>
                <Ionicons name="alert-circle-outline" size={22} color={Palette.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t.title}</Text>
                <Text style={styles.date}>{t.dateLabel}</Text>
              </View>
              <View style={styles.openBadge}>
                <View style={styles.openDot} />
                <Text style={styles.openText}>{t.status}</Text>
              </View>
            </View>

            <View style={styles.tags}>
              <View style={styles.tag}><Text style={styles.tagText}>Medium priority</Text></View>
              {sessionRef(t.body) ? (
                <View style={styles.tag}><Text style={styles.tagText}>Session {sessionRef(t.body)}</Text></View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.viewRow} activeOpacity={0.7}>
              <Text style={styles.viewText}>View details</Text>
              <Ionicons name="chevron-forward" size={16} color={Palette.forest} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.fabWrap}>
        <VoltButton label="New ticket" icon="add" />
      </View>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },
  title: { fontFamily: Font.display, fontSize: 26, color: Palette.ink },
  intro: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist, lineHeight: 22 },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.md, ...Shadow.soft },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconChip: { width: 44, height: 44, borderRadius: Radius.chip, backgroundColor: Palette.amberSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: Font.displaySemi, fontSize: 17, color: Palette.ink },
  date: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.volt },
  openText: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest },

  tags: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  tag: { backgroundColor: Palette.surfaceAlt, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  tagText: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },

  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.forest },

  fabWrap: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, bottom: 28 },
});
