import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { addTicket, useAppStore } from '@/data/app-store';

const ISSUES = [
  'Charging didn’t start',
  'Charging stopped early',
  'Charged the wrong amount',
  'Charger is damaged or offline',
  'App problem',
  'Something else',
];

/** Raise a support ticket: pick what went wrong, optionally link a session, describe it. */
export default function NewTicket() {
  const router = useRouter();
  const history = useAppStore((st) => st.history).slice(0, 3); // select the stable array, slice outside
  const [issue, setIssue] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sentId, setSentId] = useState<string | null>(null);

  const linked = history.find((h) => h.id === sessionId);
  const submit = () => {
    if (!issue) return;
    const body = [text.trim(), linked ? `Linked session: ${linked.station}, ${linked.dateLabel} (${linked.connectorLabel}).` : '']
      .filter(Boolean)
      .join('\n\n');
    setSentId(addTicket({ title: issue, body: body || 'No extra details given.', priority: 'Medium priority' }));
  };

  if (sentId) {
    return (
      <View style={styles.container}>
        <AppHeader back />
        <View style={styles.done}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={32} color={Palette.white} />
          </View>
          <Text style={styles.doneTitle}>Ticket raised</Text>
          <Text style={styles.doneText}>Ticket {sentId.toUpperCase()} is with our team. We&apos;ll call or email you, usually within one working day.</Text>
          <VoltButton label="View my tickets" onPress={() => router.replace('/tickets')} style={{ alignSelf: 'stretch', marginTop: Spacing.xl }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Raise a ticket</Text>

        <Text style={styles.label}>What went wrong?</Text>
        <View style={styles.options}>
          {ISSUES.map((i) => (
            <TouchableOpacity key={i} onPress={() => setIssue(i)} activeOpacity={0.85} style={[styles.option, issue === i && styles.optionOn]}>
              <Text style={[styles.optionText, issue === i && styles.optionTextOn]}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Which session? (optional)</Text>
        {history.map((h) => {
          const on = sessionId === h.id;
          return (
            <TouchableOpacity key={h.id} onPress={() => setSessionId(on ? null : h.id)} activeOpacity={0.85} style={[styles.session, on && styles.sessionOn]}>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? Palette.volt : Palette.mistLight} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionTitle}>{h.station}</Text>
                <Text style={styles.sessionSub}>
                  {h.dateLabel} · {h.energyKwh} kWh
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.label}>Tell us more</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="What happened? Anything that helps us fix it faster."
          placeholderTextColor={Palette.mistLight}
          multiline
          style={styles.textarea}
          textAlignVertical="top"
        />

        <VoltButton label="Submit ticket" icon="send" disabled={!issue} onPress={submit} style={{ marginTop: Spacing.md }} />
        {!issue ? <Text style={styles.hint}>Pick what went wrong to continue.</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.sm },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  label: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, marginTop: Spacing.md },

  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: { paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  optionOn: { backgroundColor: Palette.volt, borderColor: Palette.volt },
  optionText: { fontFamily: Font.medium, fontSize: 13, color: Palette.inkSoft },
  optionTextOn: { color: Palette.white, fontFamily: Font.semibold },

  session: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.surface, borderRadius: Radius.chip, padding: Spacing.md, borderWidth: 1, borderColor: Palette.line },
  sessionOn: { borderColor: Palette.volt, backgroundColor: Palette.voltSofter },
  sessionTitle: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  sessionSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },

  textarea: { minHeight: 110, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.chip, padding: Spacing.md, fontFamily: Font.regular, fontSize: 15, color: Palette.ink },
  hint: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, textAlign: 'center' },

  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, paddingBottom: 100 },
  doneIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: Palette.volt, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  doneTitle: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  doneText: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22, color: Palette.mist, textAlign: 'center', marginTop: Spacing.sm },
});
