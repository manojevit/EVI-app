import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectorIcon from '@/components/connector-icon';
import { APP_MAX_WIDTH, scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { FREE_CANCEL_MINS, RESERVATION_FEE, TIME_OPTIONS } from '@/data/app-store';
import { CONNECTORS } from '@/data/connectors';
import type { Charger, Connector, Station } from '@/data/mock';
import { clock } from '@/data/reservation-helpers';

type Mode = 'time' | 'full';

/**
 * Opens when a connector's Start is tapped: charge for a set time or until full.
 * "Reserve now" switches the sheet to a reservation view (hold it for 15–60 min).
 */
export default function StartSheet({
  station,
  charger,
  connector,
  canStart,
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
  error: string | null;
  onStart: (limitMins: number | null) => void;
  onReserve: (holdMins: number) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'start' | 'reserve'>('start');
  const [mode, setMode] = useState<Mode>('time');
  const [mins, setMins] = useState<number>(30);
  const [hold, setHold] = useState<number>(30);
  const label = CONNECTORS[connector.type].label;

  const openReserve = () => {
    setHold(mode === 'time' ? mins : 30);
    setView('reserve');
  };

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
                <MinuteChips value={mins} onChange={setMins} />
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

              <Text style={styles.section}>Hold it for</Text>
              <MinuteChips value={hold} onChange={setHold} />

              <View style={styles.holdBox}>
                <Ionicons name="time-outline" size={20} color={Palette.forest} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.holdMain}>Held for you until {clock(Date.now() + hold * 60000)}</Text>
                  <Text style={styles.holdSub}>No one else can start on it until then.</Text>
                </View>
              </View>

              <View style={styles.rules}>
                <Rule icon="wallet-outline">₹{RESERVATION_FEE} booking fee, paid from your wallet</Rule>
                <Rule icon="arrow-undo-outline">Cancel within {FREE_CANCEL_MINS} min for a full refund</Rule>
              </View>

              <TouchableOpacity style={styles.startBtn} activeOpacity={0.88} onPress={() => onReserve(hold)}>
                <Ionicons name="calendar" size={16} color={Palette.white} />
                <Text style={styles.startText}>Confirm reservation · {hold} min</Text>
              </TouchableOpacity>
            </>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function MinuteChips({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  return (
    <View style={styles.chips}>
      {TIME_OPTIONS.map((m) => (
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
  error: { fontFamily: Font.medium, fontSize: 12, color: Palette.red, textAlign: 'center' },
});
