import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { useAppStore } from '@/data/app-store';
import { ACCOUNT, formatINR } from '@/data/mock';

type IconName = keyof typeof Ionicons.glyphMap;
type Item = { icon: IconName; title: string; route: string; badge?: string };

export default function AccountScreen() {
  const router = useRouter();
  const profile = useAppStore((st) => st.profile);
  const balance = useAppStore((st) => st.walletBalance);
  const openTickets = useAppStore((st) => st.tickets.filter((t) => t.status === 'Open').length);

  const groups: Item[][] = [
    [
      { icon: 'car-sport-outline', title: 'My vehicles', route: '/vehicles' },
      { icon: 'time-outline', title: 'Charging history', route: '/history' },
      { icon: 'ribbon-outline', title: 'Subscription', route: '/plans' },
    ],
    [
      { icon: 'help-circle-outline', title: 'Help & FAQs', route: '/help' },
      { icon: 'file-tray-full-outline', title: 'My tickets', route: '/tickets', badge: openTickets ? `${openTickets} open` : undefined },
      { icon: 'settings-outline', title: 'Settings', route: '/settings' },
    ],
  ];

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* profile */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/profile')} style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name.trim()[0]?.toUpperCase() ?? ACCOUNT.initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.name}
            </Text>
            <Text style={styles.phone}>{ACCOUNT.phone}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.mistLight} />
        </TouchableOpacity>

        {/* wallet: compact */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/wallet')} style={styles.wallet}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet" size={17} color={Palette.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Wallet balance</Text>
            <Text style={styles.walletAmount}>{formatINR(balance)}</Text>
          </View>
          <View style={styles.addBtn}>
            <Ionicons name="add" size={15} color={Palette.white} />
            <Text style={styles.addText}>Add money</Text>
          </View>
        </TouchableOpacity>

        {groups.map((items, g) => (
          <View key={g} style={styles.menu}>
            {items.map((item, i) => (
              <Fragment key={item.title}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push(item.route as never)}>
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={19} color={Palette.forest} />
                  </View>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
                  <Ionicons name="chevron-forward" size={17} color={Palette.mistLight} />
                </TouchableOpacity>
              </Fragment>
            ))}
          </View>
        ))}

        <VoltButton label="Log out" icon="log-out-outline" variant="outline" onPress={() => router.replace('/login')} />
      </ScrollView>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 130, gap: Spacing.md },

  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, ...Shadow.soft },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.display, fontSize: 19, color: Palette.white },
  name: { fontFamily: Font.displaySemi, fontSize: 16, color: Palette.ink },
  phone: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 1 },

  wallet: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.voltSofter, borderRadius: Radius.card, padding: Spacing.md, borderWidth: 1, borderColor: Palette.brandTint2 },
  walletIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  walletAmount: { fontFamily: Font.display, fontSize: 17, color: Palette.ink, marginTop: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7 },
  addText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },

  menu: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.md, ...Shadow.soft },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  rowIcon: { width: 34, height: 34, borderRadius: Radius.chip, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  badge: { fontFamily: Font.bold, fontSize: 11, color: Palette.amberDeep, backgroundColor: Palette.amberSoft, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineSoft, marginLeft: 46 },
});
