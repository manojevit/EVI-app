import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { saveProfile, useAppStore } from '@/data/app-store';
import { ACCOUNT } from '@/data/mock';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ProfileScreen() {
  const profile = useAppStore((st) => st.profile);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [saved, setSaved] = useState(false);

  const changed = name.trim() !== profile.name || email.trim() !== profile.email;
  const emailOk = EMAIL.test(email.trim());
  const valid = name.trim().length > 1 && emailOk;

  const save = () => {
    saveProfile({ name: name.trim(), email: email.trim() });
    setSaved(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.trim()[0]?.toUpperCase() ?? ACCOUNT.initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.sub}>Your name and email appear on receipts.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Name" icon="person-outline">
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setSaved(false);
              }}
              style={styles.input}
              autoCapitalize="words"
            />
          </Field>
          <Field label="Email" icon="mail-outline" error={!emailOk && email.length > 0 ? 'Enter a valid email' : undefined}>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setSaved(false);
              }}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Field>
          <View>
            <Text style={styles.label}>Phone</Text>
            <View style={[styles.inputWrap, styles.locked]}>
              <Ionicons name="call-outline" size={17} color={Palette.mist} />
              <Text style={styles.phone}>{ACCOUNT.phone}</Text>
              <Ionicons name="lock-closed" size={15} color={Palette.mistLight} />
            </View>
            <Text style={styles.hint}>Your login number can&apos;t be changed here.</Text>
          </View>
        </View>

        {saved ? (
          <View style={styles.saved}>
            <Ionicons name="checkmark-circle" size={18} color={Palette.forest} />
            <Text style={styles.savedText}>Changes saved</Text>
          </View>
        ) : (
          <VoltButton label="Save changes" icon="checkmark" disabled={!changed || !valid} onPress={save} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, error, children }: { label: string; icon: keyof typeof Ionicons.glyphMap; error?: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <Ionicons name={icon} size={17} color={Palette.forest} />
        {children}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.lg },

  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.display, fontSize: 22, color: Palette.white },
  title: { fontFamily: Font.display, fontSize: 20, color: Palette.ink },
  sub: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 1 },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.md, ...Shadow.soft },
  label: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.chip, paddingHorizontal: Spacing.md, height: 46, backgroundColor: Palette.surfaceAlt },
  inputError: { borderColor: Palette.red },
  locked: { backgroundColor: Palette.canvasDeep },
  input: { flex: 1, fontFamily: Font.medium, fontSize: 15, color: Palette.ink, padding: 0 },
  phone: { flex: 1, fontFamily: Font.medium, fontSize: 15, color: Palette.inkSoft },
  hint: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 6 },
  error: { fontFamily: Font.medium, fontSize: 12, color: Palette.red, marginTop: 4 },

  saved: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md },
  savedText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.forest },
});
