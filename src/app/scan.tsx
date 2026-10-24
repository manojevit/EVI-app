import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { s, scaledSheet, useAppWidth } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { findCharger } from '@/data/mock';

/** Scan the QR on a charger to open its station. The camera fills the screen below the title. */
export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useAppWidth();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);
  // square scan frame, as wide as comfortably fits
  const frame = Math.min(width - s(Spacing.lg) * 2 - s(64), s(280));

  const onScan = ({ data }: { data: string }) => {
    if (handled.current) return;
    handled.current = true;
    const hit = findCharger(data);
    if (hit) {
      setError(null);
      router.push(`/station/${hit.station.id}`);
    } else {
      setError("This QR isn't an EVIT charger. Try the code on the charger's screen.");
    }
    setTimeout(() => (handled.current = false), 2000);
  };

  const granted = permission?.granted;

  return (
    <View style={styles.container}>
      <AppHeader back />
      <View style={[styles.body, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={styles.title}>Scan to charge</Text>
        <Text style={styles.subtitle}>Point your camera at the QR code on the charger.</Text>

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
              <View style={styles.center} pointerEvents="none">
                <View style={{ width: frame, height: frame }}>
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </View>
                <Text style={styles.aim}>Fit the QR code inside the frame</Text>
              </View>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color={Palette.red} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.torch} onPress={() => setTorch((t) => !t)} activeOpacity={0.85} accessibilityLabel={torch ? 'Turn light off' : 'Turn light on'}>
                <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={20} color={Palette.ink} />
                <Text style={styles.torchText}>{torch ? 'Light on' : 'Light'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.permission}>
              <View style={styles.permIcon}>
                <MaterialCommunityIcons name="qrcode-scan" size={44} color={Palette.forest} />
              </View>
              <Text style={styles.permTitle}>Camera access needed</Text>
              <Text style={styles.permText}>EVIT uses the camera only to read the charger&apos;s QR code.</Text>
              <VoltButton label="Allow camera" icon="camera" onPress={requestPermission} style={{ alignSelf: 'stretch', marginTop: Spacing.md }} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER = 40;
const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  body: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist },

  // fills the rest of the screen
  viewfinder: { flex: 1, minHeight: 360, borderRadius: Radius.hero, overflow: 'hidden', backgroundColor: Palette.voltSofter, borderWidth: 1, borderColor: Palette.brandTint2, marginTop: Spacing.sm },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: Palette.white },
  tl: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 18 },
  aim: { fontFamily: Font.semibold, fontSize: 13, color: Palette.white, backgroundColor: 'rgba(8,24,15,0.5)', borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' },
  errorBox: { position: 'absolute', top: Spacing.md, left: Spacing.md, right: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.surface, borderRadius: Radius.chip, padding: Spacing.md },
  errorText: { flex: 1, fontFamily: Font.medium, fontSize: 13, color: Palette.ink },
  torch: { position: 'absolute', bottom: Spacing.lg, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 9 },
  torchText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink },

  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  permIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Palette.brandTint2 },
  permTitle: { fontFamily: Font.displaySemi, fontSize: 18, color: Palette.ink, marginTop: Spacing.sm },
  permText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, textAlign: 'center', lineHeight: 20 },
});
