import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import ActiveSessionBar from '@/components/active-session-bar';
import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { ACCOUNT } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

export default function ProfileScreen() {
  const [name, setName] = useState(ACCOUNT.name);
  const [email, setEmail] = useState(ACCOUNT.email);

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ACCOUNT.initial}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="NAME" icon="person-outline">
            <TextInput value={name} onChangeText={setName} style={styles.input} />
          </Field>
          <View style={styles.divider} />
          <Field label="EMAIL" icon="mail-outline">
            <TextInput value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          </Field>
          <View style={styles.divider} />
          <View style={styles.lockedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>PHONE</Text>
              <Text style={styles.phone}>{ACCOUNT.phone}</Text>
            </View>
            <Ionicons name="lock-closed" size={18} color={Palette.mistLight} />
          </View>
          <Text style={styles.hint}>Your login number can&apos;t be changed here.</Text>
        </View>

        <VoltButton label="Save changes" icon="save-outline" disabled style={{ marginTop: Spacing.lg }} />
      </ScrollView>

      <ActiveSessionBar />
    </View>
  );
}

function Field({ label, icon, children }: { label: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={20} color={Palette.forest} />
        {children}
      </View>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.lg },
  avatarRing: { alignSelf: 'center', width: 132, height: 132, borderRadius: 66, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.display, fontSize: 42, color: Palette.white },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.lg, ...Shadow.soft },
  label: { fontFamily: Font.bold, fontSize: 12, letterSpacing: 1, color: Palette.mist, marginBottom: Spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.chip, paddingHorizontal: Spacing.lg, height: 56, backgroundColor: Palette.surfaceAlt },
  input: { flex: 1, fontFamily: Font.medium, fontSize: 17, color: Palette.ink, padding: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineSoft },
  lockedRow: { flexDirection: 'row', alignItems: 'center' },
  phone: { fontFamily: Font.displaySemi, fontSize: 19, color: Palette.ink },
  hint: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist },
});
