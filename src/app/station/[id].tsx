import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { CONNECTORS } from '@/data/connectors';
import { scaledSheet } from '@/constants/responsive';
import {
  STATIONS,
  VEHICLES,
  connectorTypesAt,
  directionsUrl,
  distanceKm,
  freeConnectorCount,
  maxPowerKw,
  stationConnectors,
  type Charger,
  type Connector,
} from '@/data/mock';

export default function StationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [query, setQuery] = useState('');
  const [fav, setFav] = useState(false);

  const station = STATIONS.find((s) => s.id === id) ?? STATIONS[0];
  const total = stationConnectors(station).length;
  const free = freeConnectorCount(station);
  const km = distanceKm(station);
  const vehicle = VEHICLES[0];

  // Does this station have a free connector the user's car can use?
  const freeTypes = new Set(stationConnectors(station).filter((c) => c.availability === 'Available').map((c) => c.type));
  const anyTypes = new Set(stationConnectors(station).map((c) => c.type));
  const fitsNow = vehicle?.connectors.filter((k) => freeTypes.has(k)) ?? [];
  const fitsAtAll = vehicle?.connectors.some((k) => anyTypes.has(k));

  const chargers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return station.chargers;
    return station.chargers.filter((ch) => ch.serial.toLowerCase().includes(q));
  }, [query, station]);

  return (
    <View style={styles.container}>
      <AppHeader back rightIcon="share-social-outline" onRightPress={() => {}} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* identity */}
        <View style={styles.idRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{station.name}</Text>
              {station.active ? <View style={styles.activeDot} /> : null}
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={15} color={Palette.mist} />
              <Text style={styles.meta} numberOfLines={1}>{station.address}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setFav((f) => !f)} hitSlop={10} style={styles.roundBtn}>
            <Ionicons name={fav ? 'star' : 'star-outline'} size={21} color={fav ? Palette.amber : Palette.mist} />
          </TouchableOpacity>
        </View>

        {/* distance + navigate, call */}
        <View style={styles.actions}>
          <VoltButton
            label={`${km.toFixed(1)} km away · Navigate`}
            icon="navigate"
            onPress={() => Linking.openURL(directionsUrl(station))}
            style={{ flex: 1 }}
          />
          <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={() => Linking.openURL(`tel:${station.phone.replace(/\s/g, '')}`)}>
            <Ionicons name="call-outline" size={20} color={Palette.forest} />
          </TouchableOpacity>
        </View>

        {/* key facts */}
        <View style={styles.stats}>
          <Stat icon="flash" value={`${maxPowerKw(station)} kW`} label="fastest" />
          <View style={styles.statLine} />
          <Stat icon="pricetag" value={`₹${station.pricePerKwh}`} label="per kWh" />
          <View style={styles.statLine} />
          <Stat icon="time" value={station.hours === '24 Hours' ? '24 h' : 'Open'} label={station.hours === '24 Hours' ? 'every day' : station.hours} />
        </View>

        {/* fits your vehicle */}
        {vehicle ? (
          <View style={[styles.fit, fitsNow.length ? styles.fitOk : fitsAtAll ? styles.fitBusy : styles.fitNo]}>
            <Ionicons
              name={fitsNow.length ? 'checkmark-circle' : fitsAtAll ? 'time' : 'close-circle'}
              size={22}
              color={fitsNow.length ? Palette.forest : fitsAtAll ? Palette.amber : Palette.red}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.fitTitle}>
                {fitsNow.length ? `Fits your ${vehicle.model}` : fitsAtAll ? `Busy for your ${vehicle.model}` : `No connector for your ${vehicle.model}`}
              </Text>
              <Text style={styles.fitSub}>
                {fitsNow.length
                  ? `${fitsNow.map((k) => CONNECTORS[k].label).join(' and ')} free now`
                  : fitsAtAll
                    ? 'Its connectors are in use or offline right now'
                    : `Needs ${vehicle.connectors.map((k) => CONNECTORS[k].label).join(' or ')}`}
              </Text>
            </View>
          </View>
        ) : null}

        {/* availability + connector types here */}
        <View style={styles.card}>
          <View style={styles.availTop}>
            <Text style={styles.cardTitle}>Connectors free now</Text>
            <Text style={styles.availCount}>
              <Text style={{ color: Palette.forest }}>{free}</Text> of {total}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${total ? (free / total) * 100 : 0}%` }]} />
          </View>
          <View style={styles.typeRow}>
            {connectorTypesAt(station).map((k) => (
              <View key={k} style={styles.typeChip}>
                <ConnectorIcon type={k} size={18} />
                <Text style={styles.typeText}>{CONNECTORS[k].label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* chargers */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>
            Chargers <Text style={styles.sectionCount}>{station.chargers.length}</Text>
          </Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={Palette.mist} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Serial" placeholderTextColor={Palette.mistLight} style={styles.searchInput} />
          </View>
        </View>

        {chargers.map((ch) => (
          <ChargerCard key={ch.id} charger={ch} matches={vehicle?.connectors ?? []} />
        ))}
        {chargers.length === 0 ? <Text style={styles.empty}>No charger matches “{query}”.</Text> : null}
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={Palette.forest} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ChargerCard({ charger, matches }: { charger: Charger; matches: string[] }) {
  const off = !charger.online;
  return (
    <View style={[styles.charger, off && styles.chargerOff]}>
      <View style={styles.chHead}>
        <View style={[styles.currentBadge, charger.current === 'DC' ? styles.dcBadge : styles.acBadge, off && styles.badgeOff]}>
          <Text style={[styles.currentText, charger.current === 'DC' && !off && { color: Palette.white }]}>{charger.current}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.serial}>{charger.serial}</Text>
          <Text style={styles.chMeta}>
            Up to {charger.powerKw} kW · {charger.connectors.length} {charger.connectors.length === 1 ? 'connector' : 'connectors'}
          </Text>
        </View>
        <View style={styles.onlineRow}>
          <View style={[styles.onlineDot, { backgroundColor: off ? Palette.mistLight : Palette.volt }]} />
          <Text style={[styles.onlineText, off && { color: Palette.mistLight }]}>{off ? 'Offline' : 'Online'}</Text>
        </View>
      </View>

      {charger.connectors.map((c) => (
        <ConnectorRow key={c.id} connector={c} offline={off} fits={matches.includes(c.type)} />
      ))}
    </View>
  );
}

function ConnectorRow({ connector, offline, fits }: { connector: Connector; offline: boolean; fits: boolean }) {
  const free = !offline && connector.availability === 'Available';
  const inUse = !offline && connector.availability === 'Charging';
  return (
    <View style={styles.connRow}>
      <View style={[styles.iconBox, !free && styles.iconBoxMuted]}>
        <ConnectorIcon type={connector.type} size={30} muted={!free} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.connTitleRow}>
          <Text style={[styles.connType, !free && { color: Palette.mist }]}>{CONNECTORS[connector.type].label}</Text>
          {fits && free ? <Text style={styles.fitsTag}>Your car</Text> : null}
        </View>
        <Text style={styles.connMeta}>Connector {connector.number}</Text>
      </View>
      {free ? (
        <TouchableOpacity style={styles.startBtn} activeOpacity={0.85}>
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.statePill, inUse && styles.inUsePill]}>
          <Text style={[styles.stateText, inUse && { color: Palette.amber }]}>{inUse ? 'In use' : 'Unavailable'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingBottom: 48, gap: Spacing.md },

  idRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginTop: Spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontFamily: Font.display, fontSize: 26, color: Palette.ink },
  activeDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: Palette.volt },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  meta: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, flex: 1 },
  roundBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },

  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  callBtn: { width: 56, borderRadius: Radius.pill, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },

  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface, borderRadius: Radius.card, paddingVertical: Spacing.lg, ...Shadow.soft },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontFamily: Font.display, fontSize: 18, color: Palette.ink },
  statLabel: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  statLine: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: Palette.line },

  fit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.chip, padding: Spacing.lg },
  fitOk: { backgroundColor: Palette.voltSoft },
  fitBusy: { backgroundColor: Palette.amberSoft },
  fitNo: { backgroundColor: Palette.redSoft },
  fitTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  fitSub: { fontFamily: Font.regular, fontSize: 13, color: Palette.inkSoft, marginTop: 1 },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.md, ...Shadow.soft },
  cardTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.inkSoft },
  availTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availCount: { fontFamily: Font.display, fontSize: 16, color: Palette.mist },
  track: { height: 8, borderRadius: 4, backgroundColor: Palette.canvasDeep, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  typeText: { fontFamily: Font.medium, fontSize: 13, color: Palette.inkSoft },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  sectionTitle: { fontFamily: Font.display, fontSize: 20, color: Palette.ink },
  sectionCount: { fontFamily: Font.medium, fontSize: 15, color: Palette.mist },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, height: 40, width: 130, ...Shadow.soft },
  searchInput: { flex: 1, fontFamily: Font.medium, fontSize: 14, color: Palette.ink, padding: 0 },
  empty: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, textAlign: 'center', paddingVertical: Spacing.lg },

  charger: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.sm, ...Shadow.soft },
  chargerOff: { backgroundColor: Palette.surfaceAlt },
  chHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.line },
  currentBadge: { width: 44, height: 44, borderRadius: Radius.chip, alignItems: 'center', justifyContent: 'center' },
  dcBadge: { backgroundColor: Palette.volt },
  acBadge: { backgroundColor: Palette.voltSoft },
  badgeOff: { backgroundColor: Palette.canvasDeep },
  currentText: { fontFamily: Font.display, fontSize: 14, color: Palette.forest },
  serial: { fontFamily: Font.displaySemi, fontSize: 17, color: Palette.ink },
  chMeta: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 1 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },

  connRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 6 },
  iconBox: { width: 48, height: 48, borderRadius: Radius.chip, backgroundColor: Palette.voltSofter, alignItems: 'center', justifyContent: 'center' },
  iconBoxMuted: { backgroundColor: Palette.canvasDeep },
  connTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  connType: { fontFamily: Font.semibold, fontSize: 16, color: Palette.ink },
  fitsTag: { fontFamily: Font.bold, fontSize: 11, color: Palette.forest, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  connMeta: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 1 },
  startBtn: { backgroundColor: Palette.forest, borderRadius: Radius.pill, paddingHorizontal: Spacing.xl, paddingVertical: 10 },
  startText: { fontFamily: Font.bold, fontSize: 14, color: Palette.white },
  statePill: { backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7 },
  inUsePill: { backgroundColor: Palette.amberSoft },
  stateText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist },
});
