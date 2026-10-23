import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';

const LENGTH = 6;
const RESEND_SECONDS = 30;

function Caret() {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);
  return <Animated.View style={[styles.caret, { opacity: blink }]} />;
}

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const digits = phone && phone.length === 10 ? phone : '7877018453';
  const pretty = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;

  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputRef = useRef<any>(null);

  // resend countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = (value: string) => {
    if (value.length !== LENGTH || verifying) return;
    setVerifying(true);
    setTimeout(() => router.replace('/(tabs)'), 700);
  };

  const onChange = (v: string) => {
    const next = v.replace(/\D/g, '').slice(0, LENGTH);
    setCode(next);
    if (next.length === LENGTH) verify(next); // auto-verify on the last digit (also catches paste / SMS autofill)
  };

  const resend = () => {
    setSeconds(RESEND_SECONDS);
    setCode('');
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={8} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color={Palette.ink} />
          </TouchableOpacity>
          <BrandLogo height={34} />
        </View>

        <View style={styles.dash} />
        <Text style={styles.title}>Enter your code</Text>
        <View style={styles.sentRow}>
          <Text style={styles.sent}>
            6-digit code sent to <Text style={styles.sentStrong}>{pretty}</Text>
          </Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.edit}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* one hidden input drives all boxes, so paste and SMS autofill just work */}
        <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: LENGTH }).map((_, i) => {
            const char = code[i];
            const active = i === code.length && !verifying;
            return (
              <View key={i} style={[styles.box, char ? styles.boxFilled : null, active && styles.boxActive]}>
                {char ? <Text style={styles.digit}>{char}</Text> : active ? <Caret /> : null}
              </View>
            );
          })}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={LENGTH}
            autoFocus
            caretHidden
            style={styles.hiddenInput}
          />
        </Pressable>

        <View style={styles.resendRow}>
          {seconds > 0 ? (
            <Text style={styles.resendWait}>
              Resend code in <Text style={styles.resendTime}>0:{String(seconds).padStart(2, '0')}</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={resend} style={styles.resendBtn} hitSlop={8}>
              <Ionicons name="refresh" size={16} color={Palette.forest} />
              <Text style={styles.resendLink}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1, minHeight: Spacing.xxxl }} />

        <View style={styles.note}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Palette.forest} />
          <Text style={styles.noteText}>EVIT will never call or message you asking for this code.</Text>
        </View>

        <VoltButton
          label={verifying ? 'Verifying…' : 'Verify and continue'}
          icon={verifying ? undefined : 'arrow-forward'}
          iconAtEnd
          disabled={code.length !== LENGTH || verifying}
          onPress={() => verify(code)}
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxl },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },

  dash: { width: 30, height: 4, borderRadius: 2, backgroundColor: Palette.volt, marginTop: Spacing.huge },
  title: { fontFamily: Font.display, fontSize: 30, color: Palette.ink, marginTop: Spacing.lg },
  sentRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  sent: { fontFamily: Font.regular, fontSize: 16, color: Palette.mist },
  sentStrong: { fontFamily: Font.semibold, color: Palette.ink },
  edit: { fontFamily: Font.semibold, fontSize: 16, color: Palette.forest, textDecorationLine: 'underline' },

  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xxxl },
  box: { width: '14.5%', aspectRatio: 0.8, borderRadius: 14, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  boxFilled: { borderColor: Palette.brandTint2, backgroundColor: Palette.voltSofter },
  boxActive: { borderColor: Palette.volt, borderWidth: 2, ...Shadow.soft },
  digit: { fontFamily: Font.display, fontSize: 26, color: Palette.ink },
  caret: { width: 2, height: 26, borderRadius: 1, backgroundColor: Palette.volt },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },

  resendRow: { marginTop: Spacing.xl, alignItems: 'flex-start' },
  resendWait: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist },
  resendTime: { fontFamily: Font.semibold, color: Palette.ink, fontVariant: ['tabular-nums'] },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resendLink: { fontFamily: Font.semibold, fontSize: 15, color: Palette.forest },

  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.voltSofter, borderRadius: Radius.chip, padding: Spacing.lg },
  noteText: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.inkSoft, lineHeight: 20 },
});
