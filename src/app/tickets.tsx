import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import type { Ticket } from '@/data/mock';

// short session ref from the ticket body, for a readable tag
function sessionRef(body: string) {
  const m = body.match(/session ([0-9a-f]{8})/i);
  return m ? `#${m[1]}` : '';
}

/** My tickets: requests raised by the user or auto-raised for a bad session. */
export default function TicketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tickets = useAppStore((st) => st.tickets);
  const [tab, setTab] = useState<'Open' | 'Closed'>('Open');
  const shown = tickets.filter((t) => (tab === 'Open' ? t.status === 'Open' : t.status !== 'Open'));

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>My tickets</Text>
        <Text style={styles.intro}>We reply by phone or email, usually within one working day.</Text>

        <View style={styles.segment}>
          {(['Open', 'Closed'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.85} style={[styles.seg, tab === t && styles.segOn]}>
              <Text style={[styles.segText, tab === t && styles.segTextOn]}>
                {t} · {tickets.filter((x) => (t === 'Open' ? x.status === 'Open' : x.status !== 'Open')).length}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {shown.map((t) => (
          <TicketCard key={t.id} t={t} onPress={() => router.push({ pathname: '/ticket/[id]', params: { id: t.id } })} />
        ))}
        {shown.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={36} color={Palette.mistLight} />
            <Text style={styles.emptyText}>{tab === 'Open' ? 'No open tickets. Everything looks good.' : 'No closed tickets yet.'}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: insets.bottom + Spacing.lg }]}>
        <VoltButton label="New ticket" icon="add" onPress={() => router.push('/new-ticket')} />
      </View>
    </View>
  );
}

function TicketCard({ t, onPress }: { t: Ticket; onPress: () => void }) {
  const ref = sessionRef(t.body);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.top}>
        <View style={styles.iconChip}>
          <Ionicons name="alert-circle-outline" size={20} color={Palette.amberDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {t.title}
          </Text>
          <Text style={styles.date}>
            {t.dateLabel}
            {ref ? ` · Session ${ref}` : ''}
          </Text>
        </View>
        <View style={styles.openBadge}>
          <View style={styles.openDot} />
          <Text style={styles.openText}>{t.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.md, paddingBottom: 120 },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  intro: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, lineHeight: 20, marginTop: -Spacing.sm },

  segment: { flexDirection: 'row', backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 4 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.pill },
  segOn: { backgroundColor: Palette.surface, ...Shadow.soft },
  segText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist },
  segTextOn: { color: Palette.ink },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, ...Shadow.soft },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconChip: { width: 38, height: 38, borderRadius: Radius.chip, backgroundColor: Palette.amberSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  date: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 2 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.volt },
  openText: { fontFamily: Font.bold, fontSize: 12, color: Palette.forest },

  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxxl },
  emptyText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist },

  fabWrap: { position: 'absolute', left: Spacing.lg, right: Spacing.lg },
});
