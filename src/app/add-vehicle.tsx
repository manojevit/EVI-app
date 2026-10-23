import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { CONNECTORS } from '@/data/connectors';
import { vehiclePhotos } from '@/data/vehicle-images';
import { VEHICLE_TYPES, makesFor, modelsFor, type VehicleModel, type VehicleType } from '@/data/vehicles';

/** Short badge text for a manufacturer: "BMW", "Tata Motors" → "TM", "Morris Garages" → "MG". */
const monogram = (make: string) =>
  make.length <= 4
    ? make.toUpperCase()
    : make
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

const TOP_MAKES = 9; // brands shown before "Show all"

export default function AddVehicleSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<VehicleType>('LMV');
  const [make, setMake] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [look, setLook] = useState(0); // which photo of the model
  const [query, setQuery] = useState('');
  const [showAllMakes, setShowAllMakes] = useState(false);
  const [plate, setPlate] = useState('');

  const typeInfo = VEHICLE_TYPES.find((t) => t.key === type)!;

  // manufacturers with the most models first; search matches a make or any of its models
  const makes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return makesFor(type)
      .map((m) => ({ make: m, models: modelsFor(type, m) }))
      .filter(
        ({ make: m, models }) => !q || m.toLowerCase().includes(q) || models.some((v) => v.model.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.models.length - a.models.length || a.make.localeCompare(b.make));
  }, [type, query]);

  const models = useMemo(() => (make ? modelsFor(type, make) : []), [type, make]);
  const model = models.find((m) => m.model === modelName) ?? null;
  const photos = vehiclePhotos(model?.model);

  const pickType = (t: VehicleType) => {
    setType(t);
    setMake(null);
    setModelName(null);
    setQuery('');
  };
  const pickMake = (m: string | null) => {
    setMake(m);
    setModelName(null);
    if (m) setQuery('');
  };
  const pickModel = (m: string) => {
    setModelName(m);
    setLook(0);
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.lg }} keyboardShouldPersistTaps="handled">
          {/* large live preview of the selected model */}
          <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
            <View style={styles.pvArt}>
              {photos.length ? (
                <Image source={photos[Math.min(look, photos.length - 1)]} style={styles.pvPhoto} contentFit="contain" transition={200} />
              ) : (
                <View style={styles.pvFallback}>
                  <MaterialCommunityIcons name={typeInfo.icon} size={72} color={model ? Palette.volt : Palette.brandTint2} />
                  {make ? <Text style={styles.pvMono}>{monogram(make)}</Text> : null}
                </View>
              )}
            </View>
            <Text style={styles.pvName}>{model?.model ?? 'Your vehicle'}</Text>
            <Text style={styles.pvSub}>{make ? `${make} · ${typeInfo.label}` : `${typeInfo.label} · pick a manufacturer`}</Text>
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

            {/* choose a look when the pack has several photos of this model */}
            {photos.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.looks}>
                {photos.map((p, i) => (
                  <TouchableOpacity key={i} onPress={() => setLook(i)} activeOpacity={0.85} style={[styles.lookTile, i === look && styles.lookOn]}>
                    <Image source={p} style={styles.lookImg} contentFit="contain" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}
          </LinearGradient>

          {/* 1. type */}
          <Step n={1} text="Vehicle type" />
          <View style={styles.typeRow}>
            {VEHICLE_TYPES.map((t) => {
              const on = t.key === type;
              return (
                <TouchableOpacity key={t.key} onPress={() => pickType(t.key)} activeOpacity={0.85} style={[styles.typeTile, on && styles.tileOn]}>
                  <MaterialCommunityIcons name={t.icon} size={28} color={on ? Palette.forest : Palette.mist} />
                  <Text style={[styles.typeLabel, on && { color: Palette.forest }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 2. manufacturer: searchable grid */}
          <Step n={2} text="Manufacturer" />
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={Palette.mist} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search brand or model"
              placeholderTextColor={Palette.mistLight}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={Palette.mistLight} />
              </TouchableOpacity>
            ) : null}
          </View>
          {make && !query ? (
            // once a brand is picked, collapse the grid so its models sit right below
            <View style={styles.pickedMake}>
              <View style={[styles.mono, styles.monoOn]}>
                <Text style={[styles.monoText, { color: Palette.white }]} numberOfLines={1}>
                  {monogram(make)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickedName}>{make}</Text>
                <Text style={styles.makeCount}>
                  {models.length} {models.length === 1 ? 'model' : 'models'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => pickMake(null)} hitSlop={8} style={styles.changeBtn}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
          <View style={styles.makeGrid}>
            {(query || showAllMakes ? makes : makes.slice(0, TOP_MAKES)).map(({ make: m, models: ms }) => {
              const on = m === make;
              return (
                <TouchableOpacity key={m} onPress={() => pickMake(m)} activeOpacity={0.85} style={[styles.makeTile, on && styles.tileOn]}>
                  <View style={[styles.mono, on && styles.monoOn]}>
                    <Text style={[styles.monoText, on && { color: Palette.white }]} numberOfLines={1}>
                      {monogram(m)}
                    </Text>
                  </View>
                  <Text style={[styles.makeName, on && { color: Palette.forest }]} numberOfLines={1}>
                    {m}
                  </Text>
                  <Text style={styles.makeCount}>
                    {ms.length} {ms.length === 1 ? 'model' : 'models'}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {makes.length === 0 ? <Text style={styles.waiting}>No brand or model matches “{query}”.</Text> : null}
            {!query && !showAllMakes && makes.length > TOP_MAKES ? (
              <TouchableOpacity onPress={() => setShowAllMakes(true)} activeOpacity={0.85} style={styles.showAll}>
                <Text style={styles.showAllText}>Show all {makes.length} brands</Text>
                <Ionicons name="chevron-down" size={16} color={Palette.forest} />
              </TouchableOpacity>
            ) : null}
          </View>
          )}

          {/* 3. model: photo cards */}
          <Step n={3} text={make ? `${make} models` : 'Model'} />
          {make ? (
            <View style={styles.modelGrid}>
              {models.map((m) => (
                <ModelCard key={m.model} m={m} on={m.model === modelName} icon={typeInfo.icon} onPress={() => pickModel(m.model)} />
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

function ModelCard({
  m,
  on,
  icon,
  onPress,
}: {
  m: VehicleModel;
  on: boolean;
  icon: (typeof VEHICLE_TYPES)[number]['icon'];
  onPress: () => void;
}) {
  const photo = vehiclePhotos(m.model)[0];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.modelCard, on && styles.modelOn]}>
      <View style={styles.modelArt}>
        {photo ? (
          <Image source={photo} style={styles.modelImg} contentFit="contain" />
        ) : (
          <MaterialCommunityIcons name={icon} size={44} color={on ? Palette.volt : Palette.brandTint2} />
        )}
      </View>
      <Text style={styles.modelName} numberOfLines={2}>
        {m.model}
      </Text>
      <Text style={styles.modelConn} numberOfLines={1}>
        {m.connectors.map((k) => CONNECTORS[k].label).join(' · ')}
      </Text>
      {on ? (
        <View style={styles.check}>
          <Ionicons name="checkmark" size={14} color={Palette.white} />
        </View>
      ) : null}
    </TouchableOpacity>
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

const styles = scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(19,32,26,0.45)' },
  sheet: { backgroundColor: Palette.canvas, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, maxHeight: '94%' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Palette.line, marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  title: { fontFamily: Font.display, fontSize: 24, color: Palette.ink },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },

  preview: { alignItems: 'center', borderRadius: Radius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Palette.brandTint2 },
  pvArt: { width: '100%', height: 130, alignItems: 'center', justifyContent: 'center' },
  pvPhoto: { width: '88%', height: 130 },
  pvFallback: { alignItems: 'center', gap: 2 },
  pvMono: { fontFamily: Font.display, fontSize: 13, color: Palette.forest, letterSpacing: 1 },
  pvName: { fontFamily: Font.display, fontSize: 20, color: Palette.ink, marginTop: Spacing.sm, textAlign: 'center' },
  pvSub: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2, textAlign: 'center' },
  pvTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: Spacing.sm },
  pvTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Palette.brandTint2 },
  pvTagText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  looks: { gap: Spacing.sm, paddingTop: Spacing.md },
  lookTile: { width: 72, height: 48, borderRadius: 12, backgroundColor: Palette.surface, borderWidth: 1.5, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  lookOn: { borderColor: Palette.volt },
  lookImg: { width: 62, height: 38 },

  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl, marginBottom: Spacing.md },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Palette.volt, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
  stepText: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },

  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeTile: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: Palette.surface, borderWidth: 1.5, borderColor: Palette.line, borderRadius: Radius.chip, paddingVertical: Spacing.md },
  tileOn: { borderColor: Palette.volt, backgroundColor: Palette.voltSofter },
  typeLabel: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist, textAlign: 'center' },

  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, height: 46, marginBottom: Spacing.md },
  searchInput: { flex: 1, fontFamily: Font.medium, fontSize: 15, color: Palette.ink, padding: 0 },
  makeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  makeTile: { flexBasis: '30%', flexGrow: 1, maxWidth: '32%', alignItems: 'center', gap: 4, backgroundColor: Palette.surface, borderWidth: 1.5, borderColor: Palette.line, borderRadius: Radius.chip, paddingVertical: Spacing.md, paddingHorizontal: 6 },
  mono: { minWidth: 40, height: 40, paddingHorizontal: 6, borderRadius: 20, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  monoOn: { backgroundColor: Palette.volt },
  monoText: { fontFamily: Font.display, fontSize: 13, color: Palette.forest },
  makeName: { fontFamily: Font.semibold, fontSize: 12, color: Palette.ink, textAlign: 'center' },
  makeCount: { fontFamily: Font.regular, fontSize: 11, color: Palette.mist },
  showAll: { flexBasis: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.md },
  showAllText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.forest },
  pickedMake: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.voltSofter, borderWidth: 1.5, borderColor: Palette.volt, borderRadius: Radius.chip, padding: Spacing.md },
  pickedName: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  changeBtn: { backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, borderColor: Palette.brandTint2 },
  changeText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },

  modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  modelCard: { flexBasis: '46%', flexGrow: 1, maxWidth: '49%', backgroundColor: Palette.surface, borderWidth: 1.5, borderColor: Palette.line, borderRadius: Radius.chip, padding: Spacing.md, gap: 4 },
  modelOn: { borderColor: Palette.volt, backgroundColor: Palette.voltSofter },
  modelArt: { height: 70, alignItems: 'center', justifyContent: 'center' },
  modelImg: { width: '100%', height: 70 },
  modelName: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, marginTop: 4 },
  modelConn: { fontFamily: Font.regular, fontSize: 11, color: Palette.mist },
  check: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: Palette.volt, alignItems: 'center', justifyContent: 'center' },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  waiting: { fontFamily: Font.regular, fontSize: 14, color: Palette.mistLight },

  connTile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.voltSofter, borderWidth: 1, borderColor: Palette.brandTint2, borderRadius: Radius.chip, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  connLabel: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  connCurrent: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  hint: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: Spacing.sm, lineHeight: 19 },

  label: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  inputWrap: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.chip, paddingHorizontal: Spacing.lg, height: 54, justifyContent: 'center' },
  input: { fontFamily: Font.medium, fontSize: 16, color: Palette.ink, padding: 0 },
});
