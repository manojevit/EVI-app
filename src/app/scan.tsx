import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { findCharger } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

const QUICK_IDS = ['EVIT-03', 'EVIT-05', 'HUBN-01'];

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  const open = (value: string, fromScan = false) => {
    const hit = findCharger(value);
    if (!hit) {
      if (!fromScan) setError(`No charger found with ID “${value.trim()}”. Check the code printed under the QR.`);
      return;
    }
    setError(null);
    router.push(`/station/${hit.station.id}`);
  };

  const onScan = ({ data }: { data: string }) => {
    if (handled.current) return;
    handled.current = true;
    open(data, true);
    setTimeout(() => (handled.current = false), 2000);
  };

  const granted = permission?.granted;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Scan to charge</Text>
        <Text style={styles.subtitle}>Point your camera at the QR code on the charger.</Text>

        {/* viewfinder */}
        <View style={styles.viewfinder}>
          {granted ? (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScan}
              />
              <View style={styles.frame} pointerEvents="none">
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
              </View>
              <TouchableOpacity style={styles.torch} onPress={() => setTorch((t) => !t)} activeOpacity={0.85}>
                <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={20} color={Palette.ink} />
                <Text style={styles.torchText}>{torch ? 'Light on' : 'Light'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.permission}>
              <View style={styles.permIcon}>
                <MaterialCommunityIcons name="qrcode-scan" size={40} color={Palette.forest} />
              </View>
              <Text style={styles.permTitle}>Camera access needed</Text>
              <Text style={styles.permText}>EVIT uses the camera only to read the charger&apos;s QR code.</Text>
              <VoltButton label="Allow camera" icon="camera" onPress={requestPermission} style={{ alignSelf: 'stretch', marginTop: Spacing.md }} />
            </View>
          )}
        </View>

        {/* divider */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or enter the charger ID</Text>
          <View style={styles.orLine} />
        </View>

        {/* manual entry */}
        <View style={styles.card}>
          <View style={[styles.inputWrap, error && styles.inputError]}>
            <MaterialCommunityIcons name="ev-station" size={20} color={Palette.forest} />
            <TextInput
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setError(null);
              }}
              placeholder="e.g. EVIT-05"
              placeholderTextColor={Palette.mistLight}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={() => open(code)}
              style={styles.input}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : <Text style={styles.hint}>The ID is printed just below the QR code on the charger.</Text>}
          <VoltButton label="Find charger" icon="arrow-forward" disabled={!code.trim()} onPress={() => open(code)} style={{ marginTop: Spacing.md }} />

          <Text style={styles.quickLabel}>Chargers near you</Text>
          <View style={styles.quickRow}>
            {QUICK_IDS.map((id) => (
              <TouchableOpacity key={id} style={styles.quick} onPress={() => open(id)} activeOpacity={0.85}>
                <Text style={styles.quickText}>{id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CORNER = 34;
const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },
  title: { fontFamily: Font.display, fontSize: 26, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist, marginTop: -Spacing.sm },

  viewfinder: { height: 300, borderRadius: Radius.hero, overflow: 'hidden', backgroundColor: Palette.voltSofter, borderWidth: 1, borderColor: Palette.brandTint2, marginTop: Spacing.sm },
  frame: { position: 'absolute', top: 40, bottom: 40, left: 60, right: 60 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: Palette.white },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  torch: { position: 'absolute', bottom: Spacing.md, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 8 },
  torchText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink },

  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  permIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Palette.brandTint2 },
  permTitle: { fontFamily: Font.displaySemi, fontSize: 18, color: Palette.ink, marginTop: Spacing.sm },
  permText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, textAlign: 'center', lineHeight: 20 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.sm },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Palette.line },
  orText: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, ...Shadow.soft },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.surfaceAlt, borderWidth: 1.5, borderColor: Palette.line, borderRadius: Radius.chip, paddingHorizontal: Spacing.lg, height: 56 },
  inputError: { borderColor: Palette.red },
  input: { flex: 1, fontFamily: Font.semibold, fontSize: 17, color: Palette.ink, letterSpacing: 1, padding: 0 },
  hint: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: Spacing.sm },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red, marginTop: Spacing.sm },
  quickLabel: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  quick: { backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 8 },
  quickText: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest, letterSpacing: 0.5 },
});
