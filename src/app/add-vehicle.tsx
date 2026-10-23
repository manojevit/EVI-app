import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { CONNECTORS } from '@/data/connectors';
import { vehiclePhoto } from '@/data/vehicle-images';
import { VEHICLE_TYPES, makesFor, modelsFor, type VehicleType } from '@/data/vehicles';
import { scaledSheet } from '@/constants/responsive';

export default function AddVehicleSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<VehicleType>('LMV');
  const [make, setMake] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [plate, setPlate] = useState('');

  const makes = useMemo(() => makesFor(type), [type]);
  const models = useMemo(() => (make ? modelsFor(type, make) : []), [type, make]);
  const model = models.find((m) => m.model === modelName) ?? null;
  const typeInfo = VEHICLE_TYPES.find((t) => t.key === type)!;

  const pickType = (t: VehicleType) => {
    setType(t);
    setMake(null);
    setModelName(null);
  };
  const pickMake = (m: string) => {
    setMake(m);
    setModelName(null);
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text style={styles.title}>Add a vehicle</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={20} color={Palette.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.lg }}>
          {/* live preview */}
          <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
            {vehiclePhoto(model?.model) ? (
              <Image source={vehiclePhoto(model?.model)} style={styles.pvPhoto} contentFit="contain" transition={200} />
            ) : (
              <MaterialCommunityIcons name={typeInfo.icon} size={64} color={model ? Palette.volt : Palette.brandTint2} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.pvName}>{model?.model ?? 'Your vehicle'}</Text>
              <Text style={styles.pvSub}>{make ?? `${typeInfo.label} · pick a manufacturer`}</Text>
              {model ? (
                <View style={styles.pvTags}>
                  {model.connectors.map((k) => (
                    <View key={k} style={styles.pvTag}>
                      <ConnectorIcon type={k} size={14} />
                      <Text style={styles.pvTagText}>{CONNECTORS[k].label}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </LinearGradient>

          {/* 1. type */}
          <Step n={1} text="Vehicle type" />
          <View style={styles.typeRow}>
            {VEHICLE_TYPES.map((t) => {
              const on = t.key === type;
              return (
                <TouchableOpacity key={t.key} onPress={() => pickType(t.key)} activeOpacity={0.85} style={[styles.typeTile, on && styles.tileOn]}>
                  <MaterialCommunityIcons name={t.icon} size={30} color={on ? Palette.forest : Palette.mist} />
                  <Text style={[styles.typeLabel, on && { color: Palette.forest }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. manufacturer */}
          <Step n={2} text="Manufacturer" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {makes.map((m) => (
              <Chip key={m} label={m} on={m === make} onPress={() => pickMake(m)} />
            ))}
          </ScrollView>

          {/* 3. model */}
          <Step n={3} text="Model" />
          {make ? (
            <View style={styles.wrapRow}>
              {models.map((m) => (
                <Chip key={m.model} label={m.model} on={m.model === modelName} onPress={() => setModelName(m.model)} />
              ))}
            </View>
          ) : (
            <Text style={styles.waiting}>Pick a manufacturer to see its models.</Text>
          )}

          {/* 4. connectors (auto) */}
          <Step n={4} text="Supported connectors" />
          {model ? (
            <>
              <View style={styles.wrapRow}>
                {model.connectors.map((k) => (
                  <View key={k} style={styles.connTile}>
                    <ConnectorIcon type={k} size={30} />
                    <View>
                      <Text style={styles.connLabel}>{CONNECTORS[k].label}</Text>
                      <Text style={styles.connCurrent}>{CONNECTORS[k].current === 'DC' ? 'Fast charging' : 'Standard charging'}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.hint}>Filled in automatically for the {model.model}. We&apos;ll show stations with these connectors first.</Text>
            </>
          ) : (
            <Text style={styles.waiting}>Filled in automatically once you pick a model.</Text>
          )}

          <Text style={styles.label}>Registration number</Text>
          <View style={styles.inputWrap}>
            <TextInput value={plate} onChangeText={setPlate} placeholder="e.g. DL 01 AB 1234" placeholderTextColor={Palette.mistLight} autoCapitalize="characters" style={styles.input} />
          </View>

          <VoltButton label="Add vehicle" icon="add" disabled={!model} onPress={() => router.back()} style={{ marginTop: Spacing.xxl }} />
        </ScrollView>
      </View>
    </View>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(19,32,26,0.45)' },
  sheet: { backgroundColor: Palette.canvas, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: '94%' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Palette.line, marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontFamily: Font.display, fontSize: 24, color: Palette.ink },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },

  preview: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, borderRadius: Radius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Palette.brandTint2 },
  pvPhoto: { width: 116, height: 72 },
  pvName: { fontFamily: Font.display, fontSize: 19, color: Palette.ink },
  pvSub: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },
  pvTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  pvTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Palette.brandTint2 },
  pvTagText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },

  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl, marginBottom: Spacing.md },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Palette.volt, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
  stepText: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },

  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeTile: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: Palette.surface, borderWidth: 1.5, borderColor: Palette.line, borderRadius: Radius.chip, paddingVertical: Spacing.md },
  tileOn: { borderColor: Palette.volt, backgroundColor: Palette.voltSofter },
  typeLabel: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist, textAlign: 'center' },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.pill, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  chipOn: { backgroundColor: Palette.volt, borderColor: Palette.volt },
  chipText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.inkSoft },
  chipTextOn: { color: Palette.white },
  waiting: { fontFamily: Font.regular, fontSize: 14, color: Palette.mistLight },

  connTile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.voltSofter, borderWidth: 1, borderColor: Palette.brandTint2, borderRadius: Radius.chip, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  connLabel: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  connCurrent: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  hint: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: Spacing.sm, lineHeight: 19 },

  label: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  inputWrap: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.chip, paddingHorizontal: Spacing.lg, height: 54, justifyContent: 'center' },
  input: { fontFamily: Font.medium, fontSize: 16, color: Palette.ink, padding: 0 },
});
