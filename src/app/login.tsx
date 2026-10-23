import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandLogo from '@/components/brand-logo';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { scaledSheet } from '@/constants/responsive';

// Full-screen background from the login design: charger photo top-right fading to white.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BACKGROUND = require('@/assets/images/login-bg.jpg');

const formatPhone = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);

/** Indian flag built from views (no emoji, renders the same everywhere). */
function IndiaFlag() {
  return (
    <View style={styles.flag}>
      <View style={[styles.stripe, { backgroundColor: '#FF9933' }]} />
      <View style={[styles.stripe, styles.white]}>
        <View style={styles.chakra} />
      </View>
      <View style={[styles.stripe, { backgroundColor: '#138808' }]} />
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState('');
  const [agree, setAgree] = useState(false);
  const [focused, setFocused] = useState(false);
  const complete = digits.length === 10;
  const ready = complete && agree;

  return (
    <View style={styles.container}>
      <Image source={BACKGROUND} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          // Logo sits ~54pt from the screen top on every phone, so the text lines up with the
          // photo in the background (which always starts at the very top) as in the design.
          contentContainerStyle={[styles.scroll, { paddingTop: Math.max(insets.top + 12, 54), paddingBottom: insets.bottom + Spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <BrandLogo height={58} />
            <View style={styles.dash} />
            <Text style={styles.title}>Sign in</Text>
            <Text style={[styles.title, styles.titleAccent]}>to charge</Text>
            <Text style={styles.subtitle}>{"Enter your mobile number.\nWe'll text you a 6-digit code\nto continue."}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Mobile number</Text>
            <View style={[styles.field, focused && styles.fieldFocused]}>
              <IndiaFlag />
              <Ionicons name="chevron-down" size={16} color={Palette.mist} style={styles.chevron} />
              <Text style={styles.prefix}>+91</Text>
              <View style={styles.sep} />
              <TextInput
                value={formatPhone(digits)}
                onChangeText={(v) => setDigits(v.replace(/\D/g, '').slice(0, 10))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="98765 43210"
                placeholderTextColor={Palette.mistLight}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                maxLength={11}
                style={styles.input}
              />
              {complete ? (
                <View style={styles.ok}>
                  <Ionicons name="checkmark" size={15} color={Palette.white} />
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.consent} activeOpacity={0.8} onPress={() => setAgree((a) => !a)}>
              <View style={[styles.checkbox, agree && styles.checkboxOn]}>
                {agree ? <Ionicons name="checkmark" size={17} color={Palette.white} /> : null}
              </View>
              <Text style={styles.consentText}>
                I agree to the <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>, and consent to EVI
                Technologies processing my data under the DPDP Act.
              </Text>
            </TouchableOpacity>

            <Pressable
              disabled={!ready}
              onPress={() => router.push({ pathname: '/otp', params: { phone: digits } })}
              style={({ pressed }) => [styles.cta, !ready && styles.ctaDisabled, pressed && styles.ctaPressed]}>
              <Text style={styles.ctaText}>Get OTP</Text>
              <Ionicons name="arrow-forward" size={22} color={Palette.white} style={styles.ctaArrow} />
            </Pressable>
            <Text style={styles.footnote}>
              {!complete ? 'Enter all 10 digits to continue.' : !agree ? 'Tick the box above to continue.' : 'Standard SMS rates may apply.'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: '#F4F8F5' },
  scroll: { flexGrow: 1, paddingHorizontal: 21 },

  intro: { paddingHorizontal: 18 },
  dash: { width: 32, height: 4, borderRadius: 2, backgroundColor: Palette.volt, marginTop: 68, marginBottom: Spacing.lg },
  title: { fontFamily: Font.displaySemi, fontSize: 36, lineHeight: 42, color: Palette.ink, letterSpacing: -0.5 },
  titleAccent: { color: Palette.forest },
  subtitle: { fontFamily: Font.regular, fontSize: 15, lineHeight: 21, color: Palette.mist, marginTop: Spacing.lg },

  card: {
    marginTop: 22,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 18,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    ...Shadow.soft,
  },
  label: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist, marginBottom: Spacing.md },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: 18, paddingHorizontal: Spacing.lg, height: 56 },
  fieldFocused: { borderColor: Palette.volt },
  flag: { width: 26, height: 18, borderRadius: 3, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: Palette.line },
  stripe: { flex: 1 },
  white: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  chakra: { width: 5, height: 5, borderRadius: 3, borderWidth: 1, borderColor: '#0B3D91' },
  chevron: { marginLeft: 6, marginRight: Spacing.md },
  prefix: { fontFamily: Font.medium, fontSize: 17, color: Palette.ink },
  sep: { width: 1, height: 26, backgroundColor: Palette.line, marginHorizontal: Spacing.md },
  input: { flex: 1, minWidth: 0, fontFamily: Font.medium, fontSize: 17, letterSpacing: 0.3, color: Palette.ink, padding: 0 },
  ok: { width: 24, height: 24, borderRadius: 12, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },

  consent: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Palette.mistLight, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  consentText: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.mist, lineHeight: 21 },
  link: { fontFamily: Font.medium, color: Palette.forest, textDecorationLine: 'underline' },

  cta: {
    marginTop: Spacing.xxl,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.volt,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaPressed: { opacity: 0.9 },
  ctaText: { fontFamily: Font.semibold, fontSize: 18, color: Palette.white },
  ctaArrow: { position: 'absolute', right: Spacing.xxl },
  footnote: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, textAlign: 'center', marginTop: Spacing.md },
});
