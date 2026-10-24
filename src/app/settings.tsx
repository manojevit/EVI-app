import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Fragment, useState, type ReactNode } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import LogoutDialog from '@/components/logout-dialog';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Settings: notifications, language, charging preferences, about, account. */
export default function SettingsScreen() {
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [prefs, setPrefs] = useState({
    chargingUpdates: true,
    lowBalance: true,
    offers: false,
    freeOnly: false,
    autoTopUp: false,
  });
  const [lang, setLang] = useState<'English' | 'हिन्दी'>('English');
  const [aboutOpen, setAboutOpen] = useState<string | null>(null);
  const toggle = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Section title="Notifications">
          <ToggleRow icon="flash-outline" title="Charging updates" sub="Started, finished and stopped" value={prefs.chargingUpdates} onChange={() => toggle('chargingUpdates')} />
          <ToggleRow icon="wallet-outline" title="Low wallet balance" sub="When it drops below ₹200" value={prefs.lowBalance} onChange={() => toggle('lowBalance')} />
          <ToggleRow icon="pricetag-outline" title="Offers and news" sub="New stations and discounts" value={prefs.offers} onChange={() => toggle('offers')} />
        </Section>

        <Section title="Language">
          <View style={styles.segment}>
            {(['English', 'हिन्दी'] as const).map((l) => (
              <TouchableOpacity key={l} onPress={() => setLang(l)} activeOpacity={0.85} style={[styles.seg, lang === l && styles.segOn]}>
                <Text style={[styles.segText, lang === l && styles.segTextOn]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {lang !== 'English' ? <Text style={styles.note}>Hindi is coming soon. The app stays in English for now.</Text> : null}
        </Section>

        <Section title="Charging">
          <ToggleRow icon="funnel-outline" title="Show only free chargers" sub="Hide busy and offline stations on the map" value={prefs.freeOnly} onChange={() => toggle('freeOnly')} />
          <ToggleRow icon="repeat-outline" title="Auto top-up" sub="Add ₹500 when the balance is below ₹200" value={prefs.autoTopUp} onChange={() => toggle('autoTopUp')} />
        </Section>

        <Section title="About">
          {[
            { k: 'terms', icon: 'document-text-outline' as IconName, title: 'Terms of use' },
            { k: 'privacy', icon: 'shield-checkmark-outline' as IconName, title: 'Privacy policy' },
          ].map((r) => (
            <Fragment key={r.k}>
              <LinkRow icon={r.icon} title={r.title} open={aboutOpen === r.k} onPress={() => setAboutOpen((o) => (o === r.k ? null : r.k))} />
              {aboutOpen === r.k ? <Text style={styles.aboutText}>The full {r.title.toLowerCase()} will be published here before launch.</Text> : null}
            </Fragment>
          ))}
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="information-circle-outline" size={19} color={Palette.forest} />
            </View>
            <Text style={[styles.rowTitle, { flex: 1 }]}>App version</Text>
            <Text style={styles.value}>{version}</Text>
          </View>
        </Section>

        <Section title="Account">
          <LinkRow icon="log-out-outline" title="Log out" onPress={() => setConfirmLogout(true)} />
          <LinkRow icon="trash-outline" title="Delete account" danger onPress={() => router.push('/new-ticket')} />
        </Section>
        <Text style={styles.foot}>Deleting your account is handled by our team. Raise a ticket and we&apos;ll confirm by phone.</Text>
      </ScrollView>
      <LogoutDialog visible={confirmLogout} onCancel={() => setConfirmLogout(false)} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ToggleRow({ icon, title, sub, value, onChange }: { icon: IconName; title: string; sub: string; value: boolean; onChange: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={Palette.forest} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Palette.line, true: Palette.volt }} thumbColor={Palette.white} />
    </View>
  );
}

function LinkRow({ icon, title, onPress, danger, open }: { icon: IconName; title: string; onPress: () => void; danger?: boolean; open?: boolean }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.rowIcon, danger && { backgroundColor: Palette.redSoft }]}>
        <Ionicons name={icon} size={19} color={danger ? Palette.red : Palette.forest} />
      </View>
      <Text style={[styles.rowTitle, { flex: 1 }, danger && { color: Palette.red }]}>{title}</Text>
      <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={18} color={Palette.mistLight} />
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 48, gap: Spacing.lg },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },

  sectionTitle: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginLeft: Spacing.xs },
  card: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, ...Shadow.soft },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  rowIcon: { width: 34, height: 34, borderRadius: Radius.chip, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
  rowSub: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, marginTop: 1 },
  value: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist },

  segment: { flexDirection: 'row', backgroundColor: Palette.canvasDeep, borderRadius: Radius.pill, padding: 4, marginVertical: Spacing.sm },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.pill },
  segOn: { backgroundColor: Palette.surface, ...Shadow.soft },
  segText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.mist },
  segTextOn: { color: Palette.ink },
  note: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist, paddingBottom: Spacing.sm },
  aboutText: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19, color: Palette.mist, paddingLeft: 46, paddingBottom: Spacing.md },

  foot: { fontFamily: Font.regular, fontSize: 12, lineHeight: 17, color: Palette.mist, textAlign: 'center', paddingHorizontal: Spacing.lg, marginTop: -Spacing.sm },
});
