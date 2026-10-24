import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { s as scale, scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { formatDuration, sessionParts, sessionReadout, showDemoSession, stopSession, useAppStore, type LiveSession } from '@/data/app-store';
import { CONNECTORS } from '@/data/connectors';
import { formatINR } from '@/data/mock';
import { vehiclePhoto } from '@/data/vehicle-images';
import { useNow } from '@/hooks/use-now';

/** Small dot that pulses to signal a live reading. */
function LiveDot() {
  const pulse = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        RNAnimated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <RNAnimated.View style={[styles.liveDot, { opacity: pulse }]} />;
}

export default function ChargingScreen() {
  const router = useRouter();
  const session = useAppStore((st) => st.session);
  const kind = session ? sessionParts(session).charger.current : null;

  return (
    <View style={styles.container}>
      <AppHeader rightIcon="receipt-outline" onRightPress={() => router.push('/history')} />
      <DemoSwitch kind={kind} />
      {session ? <LiveView key={`${session.stationId}-${session.chargerId}`} session={session} /> : <EmptyView />}
    </View>
  );
}

/** Walkthrough switch: jump between an AC and a DC session to see both live views. */
function DemoSwitch({ kind }: { kind: 'AC' | 'DC' | null }) {
  return (
    <View style={styles.demo}>
      <Text style={styles.demoLabel}>Preview</Text>
      <View style={styles.demoSeg}>
        {(['AC', 'DC'] as const).map((k) => (
          <TouchableOpacity key={k} onPress={() => showDemoSession(k)} activeOpacity={0.85} style={[styles.demoBtn, kind === k && styles.demoBtnOn]}>
            <Ionicons name="flash" size={12} color={kind === k ? Palette.white : Palette.mist} />
            <Text style={[styles.demoText, kind === k && styles.demoTextOn]}>{k === 'AC' ? 'AC charger' : 'DC fast charger'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ---------- no session ----------

function EmptyView() {
  const router = useRouter();
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="ev-plug-type2" size={40} color={Palette.forest} />
      </View>
      <Text style={styles.emptyTitle}>Not charging right now</Text>
      <Text style={styles.emptyText}>Plug in, then scan the QR code on the charger to start. Your live charge will show here.</Text>
      <VoltButton label="Scan to charge" icon="qr-code-outline" onPress={() => router.push('/scan')} style={{ alignSelf: 'stretch', marginTop: Spacing.xl }} />
      <VoltButton label="Find a charger" icon="map-outline" variant="outline" onPress={() => router.push('/map')} style={{ alignSelf: 'stretch', marginTop: Spacing.md }} />
    </View>
  );
}

// ---------- running session ----------

function LiveView({ session }: { session: LiveSession }) {
  const router = useRouter();
  const now = useNow(1000);
  const [confirming, setConfirming] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scrollRef = useRef<any>(null);
  const { station, charger, connector } = sessionParts(session);
  const r = sessionReadout(session, now);
  const vehicle = useAppStore((st) => st.vehicles[0]);
  const typeLabel = CONNECTORS[connector.type].label;

  const askStop = () => {
    setConfirming(true);
    // bring the confirm card above the tab bar
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };
  const stop = () => {
    const id = stopSession();
    setConfirming(false);
    if (id) router.push({ pathname: '/receipt/[id]', params: { id, done: '1' } });
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.statusPill}>
            {r.full ? <Ionicons name="checkmark-circle" size={14} color={Palette.forest} /> : <LiveDot />}
            <Text style={styles.statusText}>{r.full ? 'Charge complete' : 'Charging'}</Text>
          </View>
          <View style={[styles.modePill, r.dc && styles.modePillDc]}>
            <Ionicons name="flash" size={12} color={r.dc ? Palette.white : Palette.forest} />
            <Text style={[styles.modeText, r.dc && { color: Palette.white }]}>{r.dc ? `DC fast · ${typeLabel}` : `AC · ${typeLabel}`}</Text>
          </View>
        </View>

        {/* same picture for AC and DC: the car plugged into the charger */}
        <ConnectedVisual photo={vehicle?.photo ?? vehiclePhoto(vehicle?.model)} flowing={!r.full} />

        {r.dc && r.soc != null ? (
          // DC chargers read the battery, so lead with state of charge
          <View style={styles.readout}>
            <Text style={styles.big}>
              {Math.floor(r.soc)}
              <Text style={styles.bigUnit}>%</Text>
            </Text>
            <View style={styles.battery}>
              <View style={styles.batteryTrack}>
                <LinearGradient colors={Palette.gradVolt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.batteryFill, { width: `${Math.max(4, r.soc)}%` }]} />
              </View>
              <View style={styles.batteryCap} />
            </View>
            <Text style={styles.kw}>
              <Ionicons name={r.full ? 'checkmark-circle' : 'flash'} size={13} color={Palette.forest} /> {r.full ? 'Full' : `${r.powerKw} kW`}
            </Text>
          </View>
        ) : (
          <View style={styles.readout}>
            {r.full ? (
              <Ionicons name="checkmark-circle" size={50} color={Palette.forest} />
            ) : (
              <Text style={styles.big}>
                {r.powerKw}
                <Text style={styles.bigUnit}> kW</Text>
              </Text>
            )}
          </View>
        )}

        <View style={styles.stationRow}>
          <MaterialCommunityIcons name="ev-station" size={16} color={Palette.mist} />
          <Text style={styles.station} numberOfLines={1}>
            {station.name}
            <Text style={styles.connector}>
              {'  ·  '}
              {charger.serial} · Connector {connector.number}
            </Text>
          </Text>
        </View>
      </LinearGradient>

      {/* energy · time · cost — icons only */}
      <View style={styles.stats}>
        <Stat icon="battery-charging" value={r.energyKwh.toFixed(2)} unit="kWh" a11y="Energy added" />
        <View style={styles.statLine} />
        <Stat icon="time-outline" value={formatDuration(r.seconds)} a11y="Charging time" />
        <View style={styles.statLine} />
        <Stat icon="wallet-outline" value={formatINR(r.costINR)} a11y="Cost so far" />
      </View>

      {confirming ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmTitle}>Stop charging?</Text>
          <Text style={styles.confirmText}>
            You&apos;ve added {r.energyKwh.toFixed(2)} kWh for {formatINR(r.costINR)}. It will be taken from your wallet.
          </Text>
          <View style={styles.confirmRow}>
            <VoltButton label="Keep charging" variant="outline" onPress={() => setConfirming(false)} style={{ flex: 1 }} />
            <VoltButton label="Stop" icon="stop" variant="danger" onPress={stop} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <VoltButton label="Stop charging" icon="stop" variant="danger" onPress={askStop} style={{ marginTop: Spacing.sm }} />
      )}
    </ScrollView>
  );
}

/** Car ← cable with flowing energy ← charger. */
function ConnectedVisual({ photo, flowing }: { photo: unknown; flowing: boolean }) {
  const flow = useSharedValue(0);
  useEffect(() => {
    flow.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(flow);
    // shared value is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.connected}>
      <View style={styles.connectedRow}>
        <View style={styles.carBox}>
          {photo ? (
            <Image source={photo} style={styles.carImg} contentFit="contain" />
          ) : (
            <MaterialCommunityIcons name="car-side" size={52} color={Palette.forest} />
          )}
        </View>
        <View style={styles.cable}>
          <View style={styles.cableLine} />
          {flowing ? [0, 1, 2, 3].map((i) => <FlowDot key={i} flow={flow} offset={i / 4} />) : null}
        </View>
        <View style={styles.chargerBox}>
          <MaterialCommunityIcons name="ev-station" size={34} color={Palette.white} />
        </View>
      </View>
    </View>
  );
}

const CABLE = 70;
function FlowDot({ flow, offset }: { flow: SharedValue<number>; offset: number }) {
  // energy travels from the charger (right) into the car (left)
  const cable = scale(CABLE);
  const style = useAnimatedStyle(() => {
    const p = (flow.value + offset) % 1;
    return { opacity: Math.sin(p * Math.PI), transform: [{ translateX: cable * (1 - p) - 4 }] };
  });
  return <Animated.View style={[styles.flowDot, style]} />;
}

function Stat({ icon, value, unit, a11y }: { icon: keyof typeof Ionicons.glyphMap; value: string; unit?: string; a11y: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${a11y}: ${value}${unit ? ' ' + unit : ''}`}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={17} color={Palette.forest} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },

  // demo switch
  demo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  demoLabel: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist },
  demoSeg: { flex: 1, flexDirection: 'row', backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 3 },
  demoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 7, borderRadius: Radius.pill },
  demoBtnOn: { backgroundColor: Palette.forest },
  demoText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.mist },
  demoTextOn: { color: Palette.white },

  // empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xl },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: Font.display, fontSize: 22, color: Palette.ink, textAlign: 'center' },
  emptyText: { fontFamily: Font.regular, fontSize: 15, lineHeight: 22, color: Palette.mist, textAlign: 'center', marginTop: Spacing.sm },

  // hero
  hero: { borderRadius: Radius.hero, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Palette.brandTint2, ...Shadow.soft },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Palette.brandTint2 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.volt },
  statusText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.voltSoft, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  modePillDc: { backgroundColor: Palette.volt },
  modeText: { fontFamily: Font.bold, fontSize: 12, color: Palette.forest },

  connected: { alignItems: 'center', marginTop: Spacing.xl, alignSelf: 'stretch' },
  connectedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  carBox: { width: 128, height: 76, alignItems: 'center', justifyContent: 'center' },
  carImg: { width: 128, height: 76 },
  cable: { width: CABLE, height: 12, justifyContent: 'center' },
  cableLine: { height: 3, borderRadius: 2, backgroundColor: Palette.brandTint2 },
  flowDot: { position: 'absolute', left: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  chargerBox: { width: 56, height: 64, borderRadius: 16, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center', ...Shadow.volt },
  readout: { alignItems: 'center', marginTop: Spacing.lg, alignSelf: 'stretch' },
  big: { fontFamily: Font.display, fontSize: 44, lineHeight: 50, color: Palette.ink },
  bigUnit: { fontFamily: Font.displaySemi, fontSize: 20, color: Palette.mist },
  battery: { flexDirection: 'row', alignItems: 'center', width: '72%', marginTop: Spacing.sm },
  batteryTrack: { flex: 1, height: 16, borderRadius: 6, padding: 2, backgroundColor: Palette.surface, borderWidth: 1.5, borderColor: Palette.brandTint2 },
  batteryFill: { height: '100%', borderRadius: 4 },
  batteryCap: { width: 4, height: 8, borderTopRightRadius: 2, borderBottomRightRadius: 2, backgroundColor: Palette.brandTint2, marginLeft: 2 },
  kw: { fontFamily: Font.semibold, fontSize: 14, color: Palette.forest, marginTop: Spacing.sm },

  stationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg, alignSelf: 'stretch', justifyContent: 'center' },
  station: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink, flexShrink: 1 },
  connector: { fontFamily: Font.regular, color: Palette.mist },

  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface, borderRadius: Radius.card, paddingVertical: Spacing.md, ...Shadow.soft },
  stat: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  statIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: Font.display, fontSize: 17, color: Palette.ink },
  statUnit: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  statLine: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 6, backgroundColor: Palette.line },

  confirm: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.sm, borderWidth: 1, borderColor: Palette.redSoft, ...Shadow.soft },
  confirmTitle: { fontFamily: Font.displaySemi, fontSize: 17, color: Palette.ink },
  confirmText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: Palette.mist },
  confirmRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
});
