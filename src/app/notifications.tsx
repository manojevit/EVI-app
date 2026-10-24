import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import AppHeader from '@/components/app-header';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { markNotificationsRead, useAppStore } from '@/data/app-store';
import { NOTIFICATIONS, type AppNotification, type NotificationKind } from '@/data/mock';
import { scaledSheet } from '@/constants/responsive';

/** Each kind of alert gets its own icon and colour, so the list reads at a glance. */
const KIND: Record<NotificationKind, { icon: keyof typeof Ionicons.glyphMap; tint: string; ink: string }> = {
  charge: { icon: 'flash', tint: Palette.voltSoft, ink: Palette.forest },
  charger: { icon: 'checkmark-circle', tint: Palette.voltSoft, ink: Palette.forest },
  wallet: { icon: 'wallet', tint: '#E7F0FB', ink: '#2F64A8' },
  ticket: { icon: 'chatbubble-ellipses', tint: Palette.amberSoft, ink: Palette.amberDeep },
  station: { icon: 'location', tint: '#E3F4F3', ink: '#1C7A74' },
  offer: { icon: 'pricetag', tint: '#EFEAFB', ink: '#5B45A8' },
};
const GROUPS: AppNotification['group'][] = ['Today', 'Yesterday', 'Earlier'];

export default function NotificationsScreen() {
  const read = useAppStore((st) => st.readNotifications);
  const isUnread = (n: AppNotification) => !!n.unread && !read.includes(n.id);
  const unread = NOTIFICATIONS.filter(isUnread);

  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.sub}>{unread.length ? `${unread.length} unread` : 'All caught up'}</Text>
          </View>
          {unread.length ? (
            <TouchableOpacity style={styles.markBtn} activeOpacity={0.8} onPress={() => markNotificationsRead(unread.map((n) => n.id))}>
              <Ionicons name="checkmark-done" size={16} color={Palette.forest} />
              <Text style={styles.markText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {GROUPS.map((g) => {
          const items = NOTIFICATIONS.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <View key={g} style={styles.section}>
              <Text style={styles.group}>{g}</Text>
              {items.map((n) => {
                const k = KIND[n.kind];
                return (
                  <View key={n.id} style={[styles.card, isUnread(n) && styles.cardUnread]}>
                    <View style={[styles.iconChip, { backgroundColor: k.tint }]}>
                      <Ionicons name={k.icon} size={19} color={k.ink} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.top}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {n.title}
                        </Text>
                        <Text style={styles.time}>{n.timeAgo}</Text>
                        {isUnread(n) ? <View style={styles.dot} accessibilityLabel="Unread" /> : null}
                      </View>
                      <Text style={styles.body}>{n.body}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = scaledSheet({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { fontFamily: Font.display, fontSize: 22, color: Palette.ink },
  sub: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist, marginTop: 2 },
  markBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14, borderRadius: Radius.pill, backgroundColor: Palette.voltSoft },
  markText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },
  section: { gap: Spacing.sm },
  group: { fontFamily: Font.semibold, fontSize: 13, color: Palette.mist, marginLeft: Spacing.xs },
  card: { flexDirection: 'row', gap: Spacing.md, backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.md, borderWidth: 1, borderColor: 'transparent', ...Shadow.soft },
  cardUnread: { borderColor: Palette.brandTint2, backgroundColor: Palette.voltSofter },
  iconChip: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink, flex: 1 },
  time: { fontFamily: Font.regular, fontSize: 12, color: Palette.mistLight },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  body: { fontFamily: Font.regular, fontSize: 13, lineHeight: 19, color: Palette.mist, marginTop: 2 },
});
