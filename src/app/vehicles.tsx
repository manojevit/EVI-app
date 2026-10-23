import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ActiveSessionBar from '@/components/active-session-bar';
import AppHeader from '@/components/app-header';
import ConnectorIcon from '@/components/connector-icon';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { CONNECTORS } from '@/data/connectors';
import { VEHICLES } from '@/data/mock';
import { vehiclePhoto } from '@/data/vehicle-images';
import { VEHICLE_TYPES } from '@/data/vehicles';

export default function VehiclesScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <AppHeader
        back
        rightNode={
          <TouchableOpacity style={styles.add} onPress={() => router.push('/add-vehicle')} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={Palette.white} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>My vehicles</Text>

        {VEHICLES.map((v) => {
          const type = VEHICLE_TYPES.find((t) => t.key === v.type) ?? VEHICLE_TYPES[2];
          const photo = vehiclePhoto(v.model);
          return (
            <View key={v.id} style={styles.card}>
              <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.art}>
                <View style={styles.typePill}>
                  <Text style={styles.typeText}>{type.label}</Text>
                </View>
                {photo ? (
                  <Image source={photo} style={styles.photo} contentFit="contain" />
                ) : (
                  <MaterialCommunityIcons name={type.icon} size={96} color={Palette.volt} />
                )}
              </LinearGradient>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{v.model}</Text>
                    <Text style={styles.make}>{v.make}{v.plate ? ` · ${v.plate}` : ''}</Text>
                  </View>
                  <TouchableOpacity hitSlop={10} style={styles.trash}>
                    <Ionicons name="trash-outline" size={20} color={Palette.mist} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.connHead}>Supported connectors</Text>
                <View style={styles.connRow}>
                  {v.connectors.map((k) => (
                    <View key={k} style={styles.connChip}>
                      <ConnectorIcon type={k} size={26} />
                      <View>
                        <Text style={styles.connLabel}>{CONNECTORS[k].label}</Text>
                        <Text style={styles.connCurrent}>{CONNECTORS[k].current === 'DC' ? 'Fast charging' : 'Standard charging'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addCard} activeOpacity={0.8} onPress={() => router.push('/add-vehicle')}>
          <Ionicons name="add-circle-outline" size={24} color={Palette.forest} />
          <Text style={styles.addCardText}>Add another vehicle</Text>
        </TouchableOpacity>
      </ScrollView>

      <ActiveSessionBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 120 },
  heading: { fontFamily: Font.display, fontSize: 24, color: Palette.ink },
  add: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  addText: { fontFamily: Font.bold, fontSize: 15, color: Palette.white },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: Palette.line, ...Shadow.soft },
  art: { height: 190, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '84%', height: 150, marginTop: Spacing.lg },
  typePill: { position: 'absolute', top: Spacing.md, left: Spacing.md, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 5, borderWidth: 1, borderColor: Palette.brandTint2 },
  typeText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },

  info: { padding: Spacing.lg, gap: Spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: Font.display, fontSize: 21, color: Palette.ink },
  make: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, marginTop: 2 },
  trash: { padding: 6 },
  connHead: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginTop: Spacing.sm },
  connRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  connChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Palette.voltSofter, borderWidth: 1, borderColor: Palette.brandTint2, borderRadius: Radius.chip, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  connLabel: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  connCurrent: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },

  addCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Palette.brandTint2, borderStyle: 'dashed', borderRadius: Radius.card, paddingVertical: Spacing.xl, backgroundColor: Palette.surfaceAlt },
  addCardText: { fontFamily: Font.semibold, fontSize: 16, color: Palette.forest },
});
