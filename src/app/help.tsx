import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { LayoutAnimation, Linking, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { FAQS, SUPPORT_CONTACT, type Faq } from '@/data/mock';

const TOPICS = ['All', 'Charging', 'Payments', 'Account', 'App'] as const;

/** Help & FAQs: self-serve answers first, then ways to reach the team. */
export default function HelpScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('All');
  const [open, setOpen] = useState<string | null>(null);
  const openTickets = useAppStore((st) => st.tickets.filter((t) => t.status === 'Open').length);

  const faqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => (topic === 'All' || f.topic === topic) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)));
  }, [query, topic]);

  const toggle = (f: Faq) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => (o === f.id ? null : f.id));
  };

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Help &amp; FAQs</Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={Palette.mist} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search for help" placeholderTextColor={Palette.mistLight} style={styles.searchInput} />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={Palette.mistLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topics}>
          {TOPICS.map((t) => (
            <TouchableOpacity key={t} onPress={() => setTopic(t)} activeOpacity={0.85} style={[styles.topic, topic === t && styles.topicOn]}>
              <Text style={[styles.topicText, topic === t && styles.topicTextOn]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.card}>
          {faqs.map((f, i) => (
            <View key={f.id} style={i > 0 ? styles.faqBorder : null}>
              <TouchableOpacity onPress={() => toggle(f)} activeOpacity={0.7} style={styles.faqQ}>
                <Text style={styles.faqQText}>{f.q}</Text>
                <Ionicons name={open === f.id ? 'chevron-up' : 'chevron-down'} size={18} color={Palette.mist} />
              </TouchableOpacity>
              {open === f.id ? <Text style={styles.faqA}>{f.a}</Text> : null}
            </View>
          ))}
          {faqs.length === 0 ? <Text style={styles.empty}>No answers match “{query}”. Try another word, or contact us below.</Text> : null}
        </View>

        <Text style={styles.section}>Still need help?</Text>
        <View style={styles.contactRow}>
          <Contact icon="call-outline" label="Call us" onPress={() => Linking.openURL(`tel:${SUPPORT_CONTACT.phone.replace(/\s/g, '')}`)} />
          <Contact icon="mail-outline" label="Email" onPress={() => Linking.openURL(`mailto:${SUPPORT_CONTACT.email}`)} />
          <Contact icon="create-outline" label="Raise a ticket" onPress={() => router.push('/new-ticket')} />
        </View>
        <Text style={styles.hours}>Support hours: {SUPPORT_CONTACT.hours}</Text>

        <TouchableOpacity style={styles.ticketsRow} activeOpacity={0.85} onPress={() => router.push('/tickets')}>
          <View style={styles.ticketsIcon}>
            <Ionicons name="file-tray-full-outline" size={19} color={Palette.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketsTitle}>My tickets</Text>
            <Text style={styles.ticketsSub}>{openTickets ? `${openTickets} open` : 'No open tickets'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.mistLight} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Contact({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.contact} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={20} color={Palette.forest} />
      </View>
      <Text style={styles.contactLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.md },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },

  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, height: 46 },
  searchInput: { flex: 1, fontFamily: Font.medium, fontSize: 15, color: Palette.ink, padding: 0 },
  topics: { gap: Spacing.sm },
  topic: { paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  topicOn: { backgroundColor: Palette.volt, borderColor: Palette.volt },
  topicText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  topicTextOn: { color: Palette.white },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.lg, ...Shadow.soft },
  faqBorder: { borderTopWidth: 1, borderTopColor: Palette.lineSoft },
  faqQ: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  faqQText: { flex: 1, fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, lineHeight: 20 },
  faqA: { fontFamily: Font.regular, fontSize: 14, lineHeight: 21, color: Palette.inkSoft, paddingBottom: Spacing.md },
  empty: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, paddingVertical: Spacing.lg, lineHeight: 20 },

  section: { fontFamily: Font.display, fontSize: 17, color: Palette.ink, marginTop: Spacing.sm },
  contactRow: { flexDirection: 'row', gap: Spacing.sm },
  contact: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: Palette.surface, borderRadius: Radius.chip, paddingVertical: Spacing.md, ...Shadow.soft },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontFamily: Font.semibold, fontSize: 12, color: Palette.ink },
  hours: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, textAlign: 'center' },

  ticketsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, ...Shadow.soft },
  ticketsIcon: { width: 38, height: 38, borderRadius: Radius.chip, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  ticketsTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  ticketsSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
});
