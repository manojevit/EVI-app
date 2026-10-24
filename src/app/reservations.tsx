import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import ConfirmDialog from '@/components/confirm-dialog';
import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import {
  FREE_CANCEL_MINS,
  MAX_RESERVATIONS_PER_DAY,
  RESERVATION_FEE,
  canRefund,
  cancelReservation,
  liveReservation,
  reservationState,
  useAppStore,
  type Reservation,
  type ReservationState,
} from '@/data/app-store';
import { CONNECTORS } from '@/data/connectors';
import { directionsUrl } from '@/data/mock';
import { MIN, clock, dayLabel, inWords, reservationParts } from '@/data/reservation-helpers';
import { stationPhotos } from '@/data/station-photos';
import { useNow } from '@/hooks/use-now';

const STATE_LOOK: Record<ReservationState, { label: string; ink: string; tint: string }> = {
  upcoming: { label: 'Reserved', ink: Palette.forest, tint: Palette.voltSoft },
  held: { label: 'Held for you', ink: Palette.forest, tint: Palette.voltSoft },
  used: { label: 'Charged', ink: Palette.forest, tint: Palette.voltSoft },
  expired: { label: 'Expired', ink: Palette.mist, tint: Palette.canvasDeep },
  cancelled: { label: 'Cancelled', ink: Palette.red, tint: Palette.redSoft },
};

export default function ReservationsScreen() {
  const router = useRouter();
  const now = useNow(15000);
  const reservations = useAppStore((st) => st.reservations);
  const live = liveReservation(reservations, now);
  const past = reservations.filter((r) => r !== live);
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.title}>Reservations</Text>
          <Text style={styles.subtitle}>Hold a connector so it&apos;s free when you arrive.</Text>
        </View>

        {live ? (
          <LiveCard r={live} now={now} onCancel={() => setConfirmCancel(true)} />
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={28} color={Palette.forest} />
            </View>
            <Text style={styles.emptyTitle}>No reservation right now</Text>
            <Text style={styles.emptyText}>Open a station, tap Start on a free connector, then Reserve now. We hold it for you for 10 to 30 minutes.</Text>
            <VoltButton label="Find a charger" icon="map-outline" onPress={() => router.navigate('/map')} style={{ alignSelf: 'stretch', marginTop: Spacing.lg }} />
          </View>
        )}

        <View style={styles.rules}>
          <Rule icon="wallet-outline" text={`₹${RESERVATION_FEE} per booking, paid from your wallet.`} />
          <Rule icon="arrow-undo-outline" text={`Cancel within ${FREE_CANCEL_MINS} minutes of booking and you get it back.`} />
          <Rule icon="time-outline" text="Not plugged in when the hold ends? The connector is released and the fee isn't refunded." />
          <Rule icon="calendar-clear-outline" text={`One reservation at a time, up to ${MAX_RESERVATIONS_PER_DAY} a day.`} />
        </View>

        {past.length ? (
          <View style={{ gap: Spacing.sm }}>
            <Text style={styles.section}>Past reservations</Text>
            <View style={styles.list}>
              {past.map((r, i) => (
                <PastRow key={r.id} r={r} now={now} first={i === 0} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmCancel}
        icon="close-circle-outline"
        title="Cancel reservation?"
        message={
          live && canRefund(live, now)
            ? `The connector is released and ₹${live.feeINR} goes back to your wallet.`
            : `It's been more than ${FREE_CANCEL_MINS} minutes since you booked, so the fee is not refunded.`
        }
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          if (live) cancelReservation(live.id);
          setConfirmCancel(false);
        }}
      />
    </View>
  );
}

function LiveCard({ r, now, onCancel }: { r: Reservation; now: number; onCancel: () => void }) {
  const router = useRouter();
  const parts = reservationParts(r);
  if (!parts) return null;
  const { station, charger, connector } = parts;
  const st = reservationState(r, now);
  const end = r.startAt + r.holdMins * MIN;
  const photo = stationPhotos(station.id)[0]?.source;

  return (
    <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.live}>
      <View style={styles.liveTop}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{STATE_LOOK[st].label}</Text>
        </View>
        <Text style={styles.countdown}>{st === 'upcoming' ? `Starts in ${inWords(r.startAt - now)}` : `${inWords(end - now)} left`}</Text>
      </View>

      <TouchableOpacity style={styles.stationRow} activeOpacity={0.8} onPress={() => router.push({ pathname: '/station/[id]', params: { id: station.id } })}>
        {photo ? <Image source={photo} style={styles.thumb} contentFit="cover" /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.stationName} numberOfLines={1}>
            {station.name}
          </Text>
          <Text style={styles.stationAddr} numberOfLines={1}>
            {station.address}, {station.city}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Palette.mistLight} />
      </TouchableOpacity>

      <View style={styles.facts}>
        <View style={styles.fact}>
          <ConnectorIcon type={connector.type} size={30} original />
          <View style={{ flex: 1 }}>
            <Text style={styles.factMain}>{CONNECTORS[connector.type].label}</Text>
            <Text style={styles.factSub}>
              {charger.serial} · Connector {connector.number} · {charger.powerKw} kW
            </Text>
          </View>
        </View>
        <View style={styles.factLine} />
        <View style={styles.fact}>
          <View style={styles.factIcon}>
            <Ionicons name="time-outline" size={18} color={Palette.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.factMain}>Held until {clock(end)}</Text>
            <Text style={styles.factSub}>
              Booked at {clock(r.startAt)} · {r.holdMins} min hold
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <VoltButton label="Navigate" icon="navigate" onPress={() => Linking.openURL(directionsUrl(station))} style={{ flex: 1 }} />
        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function PastRow({ r, now, first }: { r: Reservation; now: number; first: boolean }) {
  const parts = reservationParts(r);
  if (!parts) return null;
  const look = STATE_LOOK[reservationState(r, now)];
  return (
    <View style={[styles.pastRow, !first && styles.pastDivider]}>
      <ConnectorIcon type={parts.connector.type} size={28} original />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.pastName} numberOfLines={1}>
          {parts.station.name}
        </Text>
        <Text style={styles.pastMeta} numberOfLines={1}>
          {dayLabel(r.startAt, now)}, {clock(r.startAt)} · {CONNECTORS[parts.connector.type].label}
        </Text>
      </View>
      <Text style={[styles.pastChip, { color: look.ink, backgroundColor: look.tint }]}>{look.label}</Text>
    </View>
  );
}

function Rule({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.rule}>
      <Ionicons name={icon} size={17} color={Palette.forest} />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.lg },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 14, color: Palette.mist, marginTop: 2 },
  section: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginLeft: Spacing.xs },

  // live booking
  live: { borderRadius: Radius.hero, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: Palette.brandTint2, ...Shadow.soft },
  liveTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Palette.brandTint2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.volt },
  statusText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  countdown: { fontFamily: Font.bold, fontSize: 14, color: Palette.forest },
  stationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: { width: 54, height: 54, borderRadius: 14, backgroundColor: Palette.canvasDeep },
  stationName: { fontFamily: Font.displaySemi, fontSize: 18, color: Palette.ink },
  stationAddr: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },
  facts: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.md },
  fact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  factLine: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.line, marginLeft: 42 },
  factIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  factMain: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  factSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  actions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  cancelBtn: { height: 52, paddingHorizontal: Spacing.xl, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.red, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.surface },
  cancelText: { fontFamily: Font.bold, fontSize: 15, color: Palette.red },

  // empty
  empty: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.xl, alignItems: 'center', ...Shadow.soft },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyTitle: { fontFamily: Font.displaySemi, fontSize: 18, color: Palette.ink, textAlign: 'center' },
  emptyText: { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, color: Palette.mist, textAlign: 'center', marginTop: Spacing.xs },

  // rules
  rules: { gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  ruleText: { flex: 1, fontFamily: Font.regular, fontSize: 13, lineHeight: 18, color: Palette.inkSoft },

  // past
  list: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.md, ...Shadow.soft },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  pastDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Palette.line },
  pastName: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  pastMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  pastChip: { fontFamily: Font.bold, fontSize: 11, borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
});
