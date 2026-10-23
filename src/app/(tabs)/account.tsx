import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import { MiniBars } from '@/components/energy-bars';
import VoltButton from '@/components/volt-button';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { ACCOUNT, formatINR } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

type IconName = keyof typeof Ionicons.glyphMap;

const MENU: { icon: IconName; title: string; subtitle: string; route: string }[] = [
  { icon: 'person-outline', title: 'Profile', subtitle: 'Name, email, phone', route: '/profile' },
  { icon: 'car-sport-outline', title: 'My vehicles', subtitle: 'Manage your EVs', route: '/vehicles' },
  { icon: 'ribbon-outline', title: 'Subscription', subtitle: 'Plans & billing', route: '/plans' },
  { icon: 'chatbubbles-outline', title: 'Help & support', subtitle: 'Tickets, contact & FAQs', route: '/support' },
  { icon: 'settings-outline', title: 'Settings', subtitle: 'Language & preferences', route: '/settings' },
];

export default function AccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* profile hero */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/profile')} style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ACCOUNT.initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{ACCOUNT.name}</Text>
            <Text style={styles.phone}>{ACCOUNT.phone}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Palette.mistLight} />
        </TouchableOpacity>

        {/* wallet */}
        <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wallet}>
          <View style={styles.walletTop}>
            <View style={styles.walletBadge}>
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={15} color={Palette.forest} />
              </View>
              <Text style={styles.walletLabel}>Wallet balance</Text>
            </View>
            <MiniBars color={Palette.volt} />
          </View>
          <Text style={styles.walletAmount}>{formatINR(ACCOUNT.walletBalance)}</Text>
          <View style={styles.walletRow}>
            <Text style={styles.walletHint}>Enough for ~1,600 kWh</Text>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={() => router.push('/wallet')}>
              <Ionicons name="add" size={18} color={Palette.white} />
              <Text style={styles.addText}>Add money</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* menu */}
        <View style={styles.menu}>
          {MENU.map((item, i) => (
            <Fragment key={item.title}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push(item.route as never)}>
                <View style={styles.rowIcon}>
                  <Ionicons name={item.icon} size={21} color={Palette.forest} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Palette.mistLight} />
              </TouchableOpacity>
            </Fragment>
          ))}
        </View>

        <VoltButton label="Log out" icon="log-out-outline" variant="outline" style={{ marginTop: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingBottom: 130, gap: Spacing.lg },

  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, ...Shadow.soft },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.display, fontSize: 24, color: Palette.white },
  name: { fontFamily: Font.displaySemi, fontSize: 21, color: Palette.ink },
  phone: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist, marginTop: 2 },

  wallet: { borderRadius: Radius.card, padding: Spacing.xl, gap: Spacing.lg, borderWidth: 1, borderColor: Palette.brandTint2, ...Shadow.soft },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  walletIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontFamily: Font.semibold, fontSize: 14, color: Palette.inkSoft },
  walletRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletAmount: { fontFamily: Font.display, fontSize: 34, color: Palette.ink, marginTop: -Spacing.sm },
  walletHint: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 10, ...Shadow.volt },
  addText: { fontFamily: Font.bold, fontSize: 14, color: Palette.white },

  menu: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.lg, ...Shadow.soft },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.lg },
  rowIcon: { width: 42, height: 42, borderRadius: Radius.chip, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: Font.semibold, fontSize: 17, color: Palette.ink },
  rowSub: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineSoft },
});
