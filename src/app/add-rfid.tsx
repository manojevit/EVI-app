import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { addRfidCard, formatUid, useAppStore } from '@/data/app-store';

// card chip ids are 4 or 7 bytes: 8 or 14 hex characters
const cleanUid = (s: string) => s.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 14);
const uidProblem = (uid: string, taken: boolean) =>
  taken ? 'This card is already on your account.' : uid.length === 8 || uid.length === 14 ? null : 'Card numbers have 8 or 14 characters (0–9, A–F).';

/** Add an RFID card the user already has. */
export default function AddRfidSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cards = useAppStore((st) => st.rfidCards);
  const vehicles = useAppStore((st) => st.vehicles);
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [vehicleId, setVehicleId] = useState<string | undefined>(vehicles[0]?.id);
  const [touched, setTouched] = useState(false);

  const problem = uidProblem(uid, cards.some((c) => c.uid === uid));
  const save = () => {
    setTouched(true);
    if (problem) return;
    addRfidCard({ uid, name: name.trim() || 'EVIT card', vehicleId });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text style={styles.title}>Add a card</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={Palette.mist} />
          </TouchableOpacity>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Text style={styles.label}>Card number</Text>
          <View style={[styles.inputWrap, touched && problem ? styles.inputBad : !problem && styles.inputOk]}>
            <Ionicons name="card-outline" size={19} color={Palette.mist} />
            <TextInput
              value={formatUid(uid)}
              onChangeText={(t) => setUid(cleanUid(t))}
              onBlur={() => uid && setTouched(true)}
              placeholder="e.g. 04A1 3F9C 2B7E 81"
              placeholderTextColor={Palette.mistLight}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
              maxLength={17}
            />
            {!problem ? <Ionicons name="checkmark-circle" size={20} color={Palette.volt} /> : null}
          </View>
          <Text style={[styles.help, touched && problem ? { color: Palette.red } : null]}>
            {touched && problem ? problem : 'Printed on the back of your card, under the barcode.'}
          </Text>

          <Text style={styles.label}>Name (optional)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="pricetag-outline" size={18} color={Palette.mist} />
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Office card" placeholderTextColor={Palette.mistLight} style={styles.input} maxLength={24} />
          </View>

          <Text style={styles.label}>Use with</Text>
          <View style={styles.chips}>
            {vehicles.map((v) => (
              <Chip key={v.id} label={v.model} on={vehicleId === v.id} onPress={() => setVehicleId(v.id)} />
            ))}
            <Chip label="Any vehicle" on={!vehicleId} onPress={() => setVehicleId(undefined)} />
          </View>

          <VoltButton label="Add card" icon="add" onPress={save} disabled={touched && !!problem} style={{ marginTop: Spacing.xl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,24,15,0.5)' },
  sheet: { backgroundColor: Palette.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: '90%' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Palette.line, marginBottom: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: Spacing.xs },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  body: { paddingBottom: Spacing.md },

  label: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, height: 52, paddingHorizontal: Spacing.md, borderRadius: 14, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface },
  inputOk: { borderColor: Palette.volt },
  inputBad: { borderColor: Palette.red },
  input: { flex: 1, fontFamily: Font.semibold, fontSize: 16, color: Palette.ink, letterSpacing: 0.5, outlineWidth: 0 },
  help: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 6 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 14, height: 38, justifyContent: 'center', borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface },
  chipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  chipTextOn: { color: Palette.white },
});
