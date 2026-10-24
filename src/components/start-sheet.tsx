import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConnectorIcon from '@/components/connector-icon';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { FREE_CANCEL_MINS, RESERVATION_FEE, TIME_OPTIONS, chargeEstimate } from '@/data/app-store';
import { CONNECTORS } from '@/data/connectors';
import type { Charger, Connector, Station } from '@/data/mock';
import { clock } from '@/data/reservation-helpers';

type Mode = 'time' | 'full';
const HOLD_WHEN_FULL = 30; // "Until full" has no minutes to pick, so a reservation holds this long

const duration = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);

/**
 * Opens when a connector's Start is tapped: charge for a set time or until full,
 * or reserve the connector for the chosen time if you're not there yet.
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
  const [mode, setMode] = useState<Mode>('time');
  const [mins, setMins] = useState<number>(30);
  const est = chargeEstimate(station, charger, mode === 'time' ? mins : null);
  const hold = mode === 'time' ? mins : HOLD_WHEN_FULL;
  const now = Date.now();

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.grabber} />

          {/* what you're about to use */}
          <View style={styles.head}>
            <View style={styles.iconBox}>
              <ConnectorIcon type={connector.type} size={36} original />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>{CONNECTORS[connector.type].label}</Text>
              <Text style={styles.sub} numberOfLines={2}>
                {charger.serial} · Connector {connector.number} · ₹{station.pricePerKwh}/kWh
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={Palette.mist} />
            </TouchableOpacity>
          </View>

          {/* set time | until full */}
          <View style={styles.tabs} accessibilityRole="tablist">
            {(
              [
                ['time', 'Set time', 'timer-outline'],
                ['full', 'Until full', 'battery-charging-outline'],
              ] as const
            ).map(([m, label, icon]) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                activeOpacity={0.85}
                style={[styles.tab, mode === m && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}>
                <Ionicons name={icon} size={16} color={mode === m ? Palette.forest : Palette.mist} />
                <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'time' ? (
            <View style={styles.chips}>
              {TIME_OPTIONS.map((m) => (
                <TouchableOpacity key={m} onPress={() => setMins(m)} activeOpacity={0.85} style={[styles.chip, mins === m && styles.chipOn]}>
                  <Text style={[styles.chipNum, mins === m && styles.chipTextOn]}>{m}</Text>
                  <Text style={[styles.chipUnit, mins === m && styles.chipTextOn]}>min</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.fullNote}>
              <Ionicons name="battery-full" size={22} color={Palette.forest} />
              <Text style={styles.fullText}>Charges until your battery is full, then stops by itself. You can stop it any time.</Text>
            </View>
          )}

          {/* what it comes to */}
          <View style={styles.estimate}>
            <Estimate label={mode === 'time' ? 'Stops at' : 'Full in about'} value={mode === 'time' ? clock(now + mins * 60000) : duration(est.minutes)} />
            <View style={styles.estLine} />
            <Estimate label="Energy" value={`≈ ${est.kwh.toFixed(1)} kWh`} />
            <View style={styles.estLine} />
            <Estimate label="Cost" value={`≈ ₹${Math.round(est.costINR)}`} />
          </View>

          <VoltButton
            label={mode === 'time' ? `Start charging · ${mins} min` : 'Start charging · until full'}
            icon="flash"
            onPress={() => onStart(mode === 'time' ? mins : null)}
            disabled={!canStart}
          />
          {!canStart ? <Text style={styles.warn}>You&apos;re already charging. Stop that charge first.</Text> : null}

          {/* not there yet */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>Not at the charger yet?</Text>
            <View style={styles.orLine} />
          </View>
          <TouchableOpacity style={styles.reserveBtn} activeOpacity={0.85} onPress={() => onReserve(hold)}>
            <Ionicons name="calendar-outline" size={18} color={Palette.forest} />
            <Text style={styles.reserveText}>
              Reserve for {hold} min · ₹{RESERVATION_FEE}
            </Text>
          </TouchableOpacity>
          <Text style={styles.reserveNote}>
            We hold this connector for you until {clock(now + hold * 60000)}. Cancel within {FREE_CANCEL_MINS} min for a full refund.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function Estimate({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.est}>
      <Text style={styles.estValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.estLabel}>{label}</Text>
    </View>
  );
}

const styles = scaledSheet({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,24,15,0.5)' },
  sheet: { backgroundColor: Palette.canvas, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: Palette.line },

  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Font.display, fontSize: 19, color: Palette.ink },
  sub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: Radius.pill },
  tabOn: { backgroundColor: Palette.surface },
  tabText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.mist },
  tabTextOn: { color: Palette.forest },

  chips: { flexDirection: 'row', gap: Spacing.sm },
  chip: { flex: 1, height: 58, borderRadius: 16, borderWidth: 1.5, borderColor: Palette.line, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: Palette.forest, borderColor: Palette.forest },
  chipNum: { fontFamily: Font.display, fontSize: 19, color: Palette.ink },
  chipUnit: { fontFamily: Font.medium, fontSize: 11, color: Palette.mist, marginTop: -2 },
  chipTextOn: { color: Palette.white },
  fullNote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.voltSofter, borderRadius: 16, borderWidth: 1, borderColor: Palette.brandTint2, padding: Spacing.md, minHeight: 58 },
  fullText: { flex: 1, fontFamily: Font.medium, fontSize: 13, lineHeight: 18, color: Palette.inkSoft },

  estimate: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surface, borderRadius: 16, paddingVertical: Spacing.md },
  est: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  estValue: { fontFamily: Font.display, fontSize: 15, color: Palette.ink },
  estLabel: { fontFamily: Font.medium, fontSize: 11, color: Palette.mist, marginTop: 2 },
  estLine: { width: 1, alignSelf: 'stretch', backgroundColor: Palette.line },

  warn: { fontFamily: Font.medium, fontSize: 12, color: Palette.amberDeep, textAlign: 'center', marginTop: -Spacing.xs },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  orLine: { flex: 1, height: 1, backgroundColor: Palette.line },
  orText: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  reserveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Palette.forest, backgroundColor: Palette.surface },
  reserveText: { fontFamily: Font.bold, fontSize: 15, color: Palette.forest },
  reserveNote: { fontFamily: Font.regular, fontSize: 12, lineHeight: 17, color: Palette.mist, textAlign: 'center', marginTop: -Spacing.xs },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red, textAlign: 'center' },
});
