import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { RESERVATION_FEE, reserve, useAppStore } from '@/data/app-store';
import { CONNECTORS } from '@/data/connectors';
import { STATIONS, distanceKm, formatINR, type Charger, type Connector } from '@/data/mock';
import { MIN, clock } from '@/data/reservation-helpers';
import { stationPhotos } from '@/data/station-photos';

const ARRIVE_IN = [15, 30, 60, 120] as const;
const HOLDS = [15, 30] as const;
const arriveLabel = (m: number) => (m < 60 ? `${m} min` : m === 60 ? '1 hour' : `${m / 60} hours`);
// round up to the next 5 minutes so times read cleanly
const roundUp5 = (t: number) => Math.ceil(t / (5 * MIN)) * 5 * MIN;

type Slot = { charger: Charger; connector: Connector };

/** Book a connector: station → connector → arrival time → hold length. */
export default function ReserveScreen() {
  const router = useRouter();
  const from = useAppStore((st) => st.location);
  const vehicle = useAppStore((st) => st.vehicles[0]);
  const balance = useAppStore((st) => st.walletBalance);
  const [error, setError] = useState<string | null>(null);

  // nearest stations that have something free right now
  const stations = useMemo(
    () =>
      STATIONS.map((s) => ({ s, km: distanceKm(s, from), free: freeSlots(s.chargers).length }))
        .filter((x) => x.free > 0)
        .sort((a, b) => a.km - b.km)
        .slice(0, 5),
    [from],
  );
  const [stationId, setStationId] = useState(stations[0]?.s.id);
  const station = STATIONS.find((s) => s.id === stationId);

  // connectors that fit the user's car come first
  const slots = useMemo(() => {
    const all = station ? freeSlots(station.chargers) : [];
    const fits = (x: Slot) => (vehicle?.connectors ?? []).includes(x.connector.type);
    return [...all.filter(fits), ...all.filter((x) => !fits(x))];
  }, [station, vehicle]);
  const [slotKey, setSlotKey] = useState<string | null>(null);
  const slot = slots.find((x) => key(x) === slotKey) ?? slots[0];

  const [arriveIn, setArriveIn] = useState<(typeof ARRIVE_IN)[number]>(30);
  const [hold, setHold] = useState<(typeof HOLDS)[number]>(30);
  const startAt = roundUp5(Date.now() + arriveIn * MIN);

  const book = () => {
    if (!station || !slot) return;
    const why = reserve({ stationId: station.id, chargerId: slot.charger.id, connectorId: slot.connector.id, startAt, holdMins: hold });
    if (why === 'balance') return setError(`Your wallet has ${formatINR(balance)}. Add money to book.`);
    if (why === 'exists') return setError('You already have a reservation. Cancel it to book a new one.');
    router.replace('/reservations' as never);
  };

  if (!station) {
    return (
      <View style={styles.container}>
        <AppHeader back />
        <View style={styles.none}>
          <Ionicons name="flash-off-outline" size={36} color={Palette.mist} />
          <Text style={styles.noneText}>No chargers are free near you right now. Try again in a few minutes.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reserve a charger</Text>

        <Step n={1} title="Station">
          <View style={styles.card}>
            {stations.map(({ s, km, free }, i) => {
              const on = s.id === stationId;
              const photo = stationPhotos(s.id)[0]?.source;
              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setStationId(s.id);
                    setSlotKey(null);
                    setError(null);
                  }}
                  style={[styles.row, i > 0 && styles.divider]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}>
                  {photo ? <Image source={photo} style={styles.thumb} contentFit="cover" /> : null}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.rowSub}>
                      {km < 10 ? km.toFixed(1) : Math.round(km)} km · {free} free · ₹{s.pricePerKwh}/kWh
                    </Text>
                  </View>
                  <Radio on={on} />
                </TouchableOpacity>
              );
            })}
          </View>
        </Step>

        <Step n={2} title="Connector">
          <View style={styles.card}>
            {slots.map((x, i) => {
              const on = slot && key(x) === key(slot);
              const fits = (vehicle?.connectors ?? []).includes(x.connector.type);
              return (
                <TouchableOpacity
                  key={key(x)}
                  activeOpacity={0.8}
                  onPress={() => setSlotKey(key(x))}
                  style={[styles.row, i > 0 && styles.divider]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !!on }}>
                  <ConnectorIcon type={x.connector.type} size={34} original />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {CONNECTORS[x.connector.type].label}
                      </Text>
                      {fits ? <Text style={styles.fitsTag}>Your car</Text> : null}
                    </View>
                    <Text style={styles.rowSub}>
                      {x.charger.serial} · Connector {x.connector.number} · {x.charger.powerKw} kW {x.charger.current}
                    </Text>
                  </View>
                  <Radio on={!!on} />
                </TouchableOpacity>
              );
            })}
          </View>
        </Step>

        <Step n={3} title="Arriving in">
          <View style={styles.chips}>
            {ARRIVE_IN.map((m) => (
              <Chip key={m} label={arriveLabel(m)} on={arriveIn === m} onPress={() => setArriveIn(m)} />
            ))}
          </View>
          <Text style={styles.hint}>You&apos;ll arrive at about {clock(startAt)}.</Text>
        </Step>

        <Step n={4} title="Hold it for">
          <View style={styles.segment}>
            {HOLDS.map((h) => (
              <TouchableOpacity key={h} activeOpacity={0.85} onPress={() => setHold(h)} style={[styles.seg, hold === h && styles.segOn]}>
                <Text style={[styles.segText, hold === h && styles.segTextOn]}>{h} minutes</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Step>

        {slot ? (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>{station.name}</Text>
            <Text style={styles.summaryLine}>
              {CONNECTORS[slot.connector.type].label} · {clock(startAt)} – {clock(startAt + hold * MIN)}
            </Text>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Reservation fee</Text>
              <Text style={styles.feeValue}>₹{RESERVATION_FEE}</Text>
            </View>
            <Text style={styles.feeNote}>Paid from your wallet. Refunded if you cancel before {clock(startAt)}.</Text>
          </View>
        ) : null}

        {error ? (
          <Text style={styles.error} onPress={error.startsWith('Your wallet') ? () => router.push('/wallet') : undefined}>
            {error}
          </Text>
        ) : null}

        <VoltButton label={`Reserve · ₹${RESERVATION_FEE}`} icon="calendar" onPress={book} disabled={!slot} />
      </ScrollView>
    </View>
  );
}

const key = (x: Slot) => `${x.charger.id}:${x.connector.id}`;
const freeSlots = (chargers: Charger[]): Slot[] =>
  chargers.flatMap((charger) => (charger.online ? charger.connectors.filter((c) => c.availability === 'Available').map((connector) => ({ charger, connector })) : []));

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={styles.stepHead}>
        <View style={styles.stepNum}>
          <Text style={styles.stepNumText}>{n}</Text>
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Radio({ on }: { on: boolean }) {
  return <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>;
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.xl },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },

  stepHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
  stepTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },

  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.md, ...Shadow.soft },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Palette.line },
  thumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: Palette.canvasDeep },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink, flexShrink: 1 },
  rowSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 2 },
  fitsTag: { fontFamily: Font.bold, fontSize: 10, color: Palette.forest, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Palette.line, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: Palette.forest },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: Palette.forest },

  chips: { flexDirection: 'row', gap: Spacing.sm },
  chip: { flex: 1, alignItems: 'center', paddingHorizontal: 4, height: 40, justifyContent: 'center', borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface },
  chipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  chipTextOn: { color: Palette.white },
  hint: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist },

  segment: { flexDirection: 'row', backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 4 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.pill },
  segOn: { backgroundColor: Palette.surface, ...Shadow.soft },
  segText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.mist },
  segTextOn: { color: Palette.ink },

  summary: { backgroundColor: Palette.voltSofter, borderRadius: Radius.card, padding: Spacing.lg, borderWidth: 1, borderColor: Palette.brandTint2, gap: 4 },
  summaryTitle: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  summaryLine: { fontFamily: Font.medium, fontSize: 13, color: Palette.inkSoft },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  feeLabel: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  feeValue: { fontFamily: Font.display, fontSize: 16, color: Palette.forest },
  feeNote: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },

  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red, textAlign: 'center', marginTop: -Spacing.sm },
  none: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl },
  noneText: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, textAlign: 'center' },
});
