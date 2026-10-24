import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Fragment, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import LogoutDialog from '@/components/logout-dialog';
import VoltButton from '@/components/volt-button';
import { scaledSheet } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { liveReservation, setFilters, useAppStore } from '@/data/app-store';
import { ACCOUNT, formatINR } from '@/data/mock';
import { clock, dayLabel } from '@/data/reservation-helpers';

type IconName = keyof typeof Ionicons.glyphMap;
type Item = { icon: IconName; title: string; hint: string; route: string; badge?: string };

export default function AccountScreen() {
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const profile = useAppStore((st) => st.profile);
  const balance = useAppStore((st) => st.walletBalance);
  const history = useAppStore((st) => st.history);
  const vehicleCount = useAppStore((st) => st.vehicles.length);
  const openTickets = useAppStore((st) => st.tickets.filter((t) => t.status === 'Open').length);
  const savedStations = useAppStore((st) => st.favourites.length);
  const reservations = useAppStore((st) => st.reservations);
  const activeCards = useAppStore((st) => st.rfidCards.filter((c) => c.status === 'active').length);
  const booked = liveReservation(reservations);
  // saved stations: open the map showing only those
  const openSaved = () => {
    setFilters({ favouritesOnly: true });
    router.navigate('/map');
  };
  const phone = ACCOUNT.phone.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');

  const groups: Item[][] = [
    [
      {
        icon: 'calendar-outline',
        title: 'Reservations',
        hint: booked ? `${dayLabel(booked.startAt)}, ${clock(booked.startAt)}` : 'Hold a charger before you arrive',
        route: '/reservations',
        badge: booked ? '1 upcoming' : undefined,
      },
      { icon: 'card-outline', title: 'RFID cards', hint: activeCards ? `${activeCards} active ${activeCards === 1 ? 'card' : 'cards'}` : 'Charge without your phone', route: '/rfid' },
      { icon: 'time-outline', title: 'Charging history', hint: 'Receipts for every charge', route: '/history' },
    ],
    [
      { icon: 'car-sport-outline', title: 'My vehicles', hint: `${vehicleCount} saved`, route: '/vehicles' },
      { icon: 'ribbon-outline', title: 'Subscription', hint: 'Save on every kWh', route: '/plans' },
    ],
    [
      { icon: 'help-circle-outline', title: 'Help & FAQs', hint: 'Answers and contact', route: '/help' },
      { icon: 'file-tray-full-outline', title: 'My tickets', hint: 'Issues you raised', route: '/tickets', badge: openTickets ? `${openTickets} open` : undefined },
      { icon: 'settings-outline', title: 'Settings', hint: 'Notifications, language', route: '/settings' },
    ],
  ];

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* profile */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/profile')} style={styles.profile}>
          <View style={styles.profileTop}>
            <LinearGradient colors={Palette.gradForest} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name.trim()[0]?.toUpperCase() ?? ACCOUNT.initial}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={styles.phone}>{phone}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {profile.email}
              </Text>
            </View>
            <View style={styles.editBtn}>
              <Ionicons name="create-outline" size={18} color={Palette.forest} />
            </View>
          </View>
          <View style={styles.stats}>
            <Stat value={String(history.length)} label="Charges" />
            <View style={styles.statLine} />
            <TouchableOpacity style={styles.stat} activeOpacity={0.7} onPress={openSaved} accessibilityLabel={`${savedStations} saved stations, show on map`}>
              <Text style={styles.statValue}>{savedStations}</Text>
              <Text style={styles.statLabel}>Saved stations</Text>
            </TouchableOpacity>
            <View style={styles.statLine} />
            <Stat value={String(vehicleCount)} label={vehicleCount === 1 ? 'Vehicle' : 'Vehicles'} />
          </View>
        </TouchableOpacity>

        {/* wallet */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/wallet')} style={styles.wallet}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet" size={22} color={Palette.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Wallet balance</Text>
            <Text style={styles.walletAmount}>{formatINR(balance)}</Text>
          </View>
          <View style={styles.addBtn}>
            <Ionicons name="add" size={18} color={Palette.white} />
            <Text style={styles.addText}>Add</Text>
          </View>
        </TouchableOpacity>

        {groups.map((items, g) => (
          <View key={g} style={styles.menu}>
            {items.map((item, i) => (
              <Fragment key={item.title}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push(item.route as never)}>
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={22} color={Palette.forest} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowHint}>{item.hint}</Text>
                  </View>
                  {item.badge ? <Text style={styles.badge}>{item.badge}</Text> : null}
                  <Ionicons name="chevron-forward" size={19} color={Palette.mistLight} />
                </TouchableOpacity>
              </Fragment>
            ))}
          </View>
        ))}

        <VoltButton label="Log out" icon="log-out-outline" variant="outline" onPress={() => setConfirmLogout(true)} />
      </ScrollView>
      <LogoutDialog visible={confirmLogout} onCancel={() => setConfirmLogout(false)} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xl, gap: Spacing.lg },

  profile: { backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, gap: Spacing.lg, ...Shadow.soft },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatar: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Font.display, fontSize: 25, color: Palette.white },
  name: { fontFamily: Font.displaySemi, fontSize: 19, color: Palette.ink },
  phone: { fontFamily: Font.medium, fontSize: 14, color: Palette.inkSoft, marginTop: 3 },
  email: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 1 },
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.surfaceAlt, borderRadius: Radius.chip, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Palette.lineSoft },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: Font.display, fontSize: 18, color: Palette.ink },
  statLabel: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  statLine: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: Palette.line },

  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Palette.voltSofter,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
  },
  walletIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontFamily: Font.medium, fontSize: 14, color: Palette.mist },
  walletAmount: { fontFamily: Font.display, fontSize: 23, color: Palette.ink, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  addText: { fontFamily: Font.bold, fontSize: 14, color: Palette.white },

  menu: { backgroundColor: Palette.surface, borderRadius: Radius.card, paddingHorizontal: Spacing.lg, ...Shadow.soft },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  rowIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Palette.voltSofter, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: Font.semibold, fontSize: 16, color: Palette.ink },
  rowHint: { fontFamily: Font.regular, fontSize: 13, color: Palette.mist, marginTop: 2 },
  badge: { fontFamily: Font.bold, fontSize: 12, color: Palette.amberDeep, backgroundColor: Palette.amberSoft, borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.line, marginLeft: 56 },
});
