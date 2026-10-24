import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectorIcon from '@/components/connector-icon';
import { APP_MAX_WIDTH, scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import {
  GRACE_MINS,
  HOLD_OPTIONS,
  MAX_RESERVATIONS_PER_DAY,
  NO_SHOW_LIMIT,
  NO_SHOW_PAUSE_HOURS,
  RESERVATION_FEE,
  SLOT_DAYS_AHEAD,
  SLOT_HOLD_MINS,
  TIME_OPTIONS,
} from '@/data/app-store';
import { CONNECTORS } from '@/data/connectors';
import type { Charger, Connector, Station } from '@/data/mock';
import { clock, dayLabel } from '@/data/reservation-helpers';

type Mode = 'time' | 'full';

// bookable slots: every 30 minutes from 6 am to 10:30 pm, at least 30 minutes from now
const DAY = 86400000;
const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);
function slotsFor(day: number, now: number) {
  const out: number[] = [];
  for (let m = 6 * 60; m <= 22 * 60 + 30; m += 30) {
    const t = day + m * 60000;
    if (t >= now + 30 * 60000) out.push(t);
  }
  return out;
}
const dayChip = (day: number, now: number) => {
  const label = dayLabel(day, now);
  return label === 'Today' || label === 'Tomorrow' ? label : new Date(day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
};
/** Suggested hold: enough to drive over plus a few minutes, from the options. */
const suggestHold = (eta: number) => HOLD_OPTIONS.find((o) => o >= eta + 5) ?? HOLD_OPTIONS[HOLD_OPTIONS.length - 1];

/**
 * Opens when a connector's Start is tapped: charge for a set time or until full.
 * "Reserve now" switches the sheet to a reservation view: hold it from now (10–30 min) or book a slot.
 */
export default function StartSheet({
  station,
  charger,
  connector,
  canStart,
  etaMins,
  error,
  onStart,
  onReserve,
  onClose,
}: {
  station: Station;
  charger: Charger;
  connector: Connector;
  /** false while another charge is running */
  canStart: boolean;
  /** rough drive time to the station, for the suggested hold */
  etaMins: number;
  error: string | null;
  onStart: (limitMins: number | null) => void;
  /** without startAt: hold from now; with it: a slot booked for later */
  onReserve: (holdMins: number, startAt?: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'start' | 'reserve'>('start');
  const [mode, setMode] = useState<Mode>('time');
  const [mins, setMins] = useState<number>(30);
  const tooFar = etaMins > HOLD_OPTIONS[HOLD_OPTIONS.length - 1] - 5;
  const [hold, setHold] = useState<number>(suggestHold(etaMins));
  const [when, setWhen] = useState<'now' | 'later'>(tooFar ? 'later' : 'now');
  const now = Date.now();
  const days = Array.from({ length: SLOT_DAYS_AHEAD }, (_, i) => startOfDay(now) + i * DAY).filter((d) => slotsFor(d, now).length);
  const [day, setDay] = useState<number>(days[0]);
  const slots = slotsFor(day, now);
  const [slot, setSlot] = useState<number | null>(slots[0] ?? null);
  const label = CONNECTORS[connector.type].label;

  const openReserve = () => {
    setHold(suggestHold(etaMins));
    setView('reserve');
  };
  const pickDay = (d: number) => {
    setDay(d);
    setSlot(slotsFor(d, Date.now())[0] ?? null);
  };
  const confirm = () => (when === 'now' ? onReserve(hold) : slot != null ? onReserve(SLOT_HOLD_MINS, slot) : undefined);

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={view === 'reserve' ? () => setView('start') : onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { maxWidth: APP_MAX_WIDTH, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.grabber} />

          {view === 'start' ? (
            <>
              {/* what you're about to use */}
              <View style={styles.head}>
                <View style={styles.iconBox}>
                  <ConnectorIcon type={connector.type} size={30} original />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.title}>{label}</Text>
                  <Text style={styles.sub} numberOfLines={2}>
                    {charger.serial} · Connector {connector.number} · ₹{station.pricePerKwh}/kWh
                  </Text>
                </View>
                <CloseButton onPress={onClose} />
              </View>

              {/* set time | until full */}
              <View style={styles.tabs} accessibilityRole="tablist">
                {(
                  [
                    ['time', 'Set time', 'timer-outline'],
                    ['full', 'Until full', 'battery-charging-outline'],
                  ] as const
                ).map(([m, text, icon]) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMode(m)}
                    activeOpacity={0.85}
                    style={[styles.tab, mode === m && styles.tabOn]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: mode === m }}>
                    <Ionicons name={icon} size={15} color={mode === m ? Palette.forest : Palette.mist} />
                    <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>{text}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mode === 'time' ? (
                <MinuteChips options={TIME_OPTIONS} value={mins} onChange={setMins} />
              ) : (
                <View style={styles.fullNote}>
                  <Ionicons name="battery-full" size={19} color={Palette.forest} />
                  <Text style={styles.fullText}>Charges until your battery is full, then stops by itself. You can stop it any time.</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.startBtn, !canStart && styles.startOff]}
                activeOpacity={0.88}
                disabled={!canStart}
                onPress={() => onStart(mode === 'time' ? mins : null)}>
                <Ionicons name="flash" size={17} color={Palette.white} />
                <Text style={styles.startText}>{mode === 'time' ? `Start charging · ${mins} min` : 'Start charging · until full'}</Text>
              </TouchableOpacity>
              {!canStart ? <Text style={styles.warn}>You&apos;re already charging. Stop that charge first.</Text> : null}

              {/* not there yet */}
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>Not at the charger yet?</Text>
                <View style={styles.orLine} />
              </View>
              <TouchableOpacity style={styles.reserveBtn} activeOpacity={0.85} onPress={openReserve}>
                <Ionicons name="calendar-outline" size={16} color={Palette.forest} />
                <Text style={styles.reserveText}>Reserve now</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* reservation view */}
              <View style={styles.head}>
                <TouchableOpacity onPress={() => setView('start')} hitSlop={10} style={styles.backBtn} accessibilityLabel="Back">
                  <Ionicons name="chevron-back" size={20} color={Palette.ink} />
                </TouchableOpacity>
                <Text style={[styles.title, { flex: 1 }]}>Reserve this connector</Text>
                <CloseButton onPress={onClose} />
              </View>

              <View style={styles.resCard}>
                <View style={styles.iconBox}>
                  <ConnectorIcon type={connector.type} size={30} original />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.resName} numberOfLines={1}>
                    {label}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {station.name} · {charger.serial} · Connector {connector.number}
                  </Text>
                </View>
              </View>

              {/* now | later */}
              <View style={styles.tabs} accessibilityRole="tablist">
                {(
                  [
                    ['now', 'Now', 'flash-outline'],
                    ['later', 'Later', 'calendar-outline'],
                  ] as const
                ).map(([m, text, icon]) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setWhen(m)}
                    activeOpacity={0.85}
                    style={[styles.tab, when === m && styles.tabOn]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: when === m }}>
                    <Ionicons name={icon} size={15} color={when === m ? Palette.forest : Palette.mist} />
                    <Text style={[styles.tabText, when === m && styles.tabTextOn]}>{text}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {when === 'now' ? (
                <>
                  <Text style={styles.suggest}>
                    <Ionicons name="car-outline" size={13} color={Palette.forest} />{' '}
                    {tooFar
                      ? `You're about ${etaMins} min away. Holds last up to ${HOLD_OPTIONS[HOLD_OPTIONS.length - 1]} min, so a Later slot may suit you better.`
                      : `You're about ${etaMins} min away, so we suggest ${suggestHold(etaMins)} min.`}
                  </Text>
                  <MinuteChips options={HOLD_OPTIONS} value={hold} onChange={setHold} />
                  <View style={styles.holdBox}>
                    <Ionicons name="time-outline" size={20} color={Palette.forest} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.holdMain}>Held for you until {clock(now + hold * 60000)}</Text>
                      <Text style={styles.holdSub}>Then {GRACE_MINS} more minutes to plug in before it&apos;s released.</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotRow}>
                    {days.map((d) => (
                      <TouchableOpacity key={d} onPress={() => pickDay(d)} activeOpacity={0.85} style={[styles.slotChip, day === d && styles.slotChipOn]}>
                        <Text style={[styles.slotText, day === d && styles.slotTextOn]}>{dayChip(d, now)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotRow}>
                    {slots.map((t) => (
                      <TouchableOpacity key={t} onPress={() => setSlot(t)} activeOpacity={0.85} style={[styles.slotChip, slot === t && styles.slotChipOn]}>
                        <Text style={[styles.slotText, slot === t && styles.slotTextOn]}>{clock(t)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {slot != null ? (
                    <View style={styles.holdBox}>
                      <Ionicons name="calendar-outline" size={20} color={Palette.forest} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.holdMain}>
                          {dayLabel(slot, now)}, {clock(slot)}
                        </Text>
                        <Text style={styles.holdSub}>
                          Held until {clock(slot + SLOT_HOLD_MINS * 60000)}, then {GRACE_MINS} more minutes to plug in.
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </>
              )}

              <View style={styles.rules}>
                {RESERVATION_FEE > 0 ? <Rule icon="wallet-outline">₹{RESERVATION_FEE} booking fee, paid from your wallet</Rule> : null}
                <Rule icon="notifications-outline">
                  {when === 'later' ? "We'll remind you 10 min before, and before it's released" : "We'll notify you before it's released"}
                </Rule>
                <Rule icon="close-circle-outline">Cancel any time in Account → Reservations</Rule>
                <Rule icon="calendar-clear-outline">
                  One at a time, up to {MAX_RESERVATIONS_PER_DAY} a day. {NO_SHOW_LIMIT} missed bookings pause booking for {NO_SHOW_PAUSE_HOURS} h
                </Rule>
              </View>

              <TouchableOpacity style={[styles.startBtn, when === 'later' && slot == null && styles.startOff]} activeOpacity={0.88} disabled={when === 'later' && slot == null} onPress={confirm}>
                <Ionicons name="calendar" size={16} color={Palette.white} />
                <Text style={styles.startText}>
                  {when === 'now' ? `Confirm · hold ${hold} min` : slot != null ? `Confirm · ${dayLabel(slot, now)} ${clock(slot)}` : 'Pick a time'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function MinuteChips({ options, value, onChange }: { options: readonly number[]; value: number; onChange: (m: number) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((m) => (
        <TouchableOpacity key={m} onPress={() => onChange(m)} activeOpacity={0.85} style={[styles.chip, value === m && styles.chipOn]}>
          <Text style={[styles.chipNum, value === m && styles.chipTextOn]}>{m}</Text>
          <Text style={[styles.chipUnit, value === m && styles.chipTextOn]}>min</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} accessibilityLabel="Close">
      <Ionicons name="close" size={24} color={Palette.mist} />
    </TouchableOpacity>
  );
}

function Rule({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: ReactNode }) {
  return (
    <View style={styles.rule}>
      <Ionicons name={icon} size={15} color={Palette.mist} />
      <Text style={styles.ruleText}>{children}</Text>
    </View>
  );
}

const styles = scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,24,15,0.5)' },
  sheet: { width: '100%', backgroundColor: Palette.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Palette.line, marginBottom: 2 },

  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  sub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },

  tabs: { flexDirection: 'row', backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 3 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 32, borderRadius: Radius.pill },
  tabOn: { backgroundColor: Palette.surface },
  tabText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist },
  tabTextOn: { color: Palette.forest },

  chips: { flexDirection: 'row', gap: Spacing.sm },
  chip: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3, paddingTop: 10 },
  chipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  chipNum: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  chipUnit: { fontFamily: Font.medium, fontSize: 11, color: Palette.mist },
  chipTextOn: { color: Palette.white },
  fullNote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Palette.voltSofter, borderRadius: 12, borderWidth: 1, borderColor: Palette.brandTint2, paddingHorizontal: Spacing.md, paddingVertical: 8, minHeight: 42 },
  fullText: { flex: 1, fontFamily: Font.medium, fontSize: 12, lineHeight: 16, color: Palette.inkSoft },


  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: Radius.pill, backgroundColor: Palette.forest },
  startOff: { opacity: 0.45 },
  startText: { fontFamily: Font.bold, fontSize: 15, color: Palette.white },
  warn: { fontFamily: Font.medium, fontSize: 12, color: Palette.amberDeep, textAlign: 'center', marginTop: -4 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: Palette.line },
  orText: { fontFamily: Font.medium, fontSize: 11, color: Palette.mist },
  reserveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.forest, backgroundColor: Palette.surface },
  reserveText: { fontFamily: Font.bold, fontSize: 14, color: Palette.forest },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  resCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Palette.surface, borderRadius: 14, padding: 10 },
  resName: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  section: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginTop: 2 },
  holdBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Palette.voltSofter, borderRadius: 14, borderWidth: 1, borderColor: Palette.brandTint2, padding: Spacing.md },
  holdMain: { fontFamily: Font.bold, fontSize: 14, color: Palette.forest },
  holdSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  rules: { gap: 6, paddingHorizontal: 2 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { flex: 1, fontFamily: Font.regular, fontSize: 12, color: Palette.inkSoft },
  suggest: { fontFamily: Font.medium, fontSize: 12, color: Palette.forest },
  slotRow: { gap: 6, paddingRight: 4 },
  slotChip: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  slotChipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  slotText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  slotTextOn: { color: Palette.white },
  error: { fontFamily: Font.medium, fontSize: 12, color: Palette.red, textAlign: 'center' },
});
