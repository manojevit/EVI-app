import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import AppHeader from '@/components/app-header';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { NOTIFICATIONS } from '@/data/mock';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <AppHeader back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.group}>Today</Text>
        {NOTIFICATIONS.map((n) => (
          <View key={n.id} style={styles.card}>
            <View style={styles.iconChip}>
              <Ionicons name="notifications" size={20} color={Palette.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.top}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.time}>{n.timeAgo}</Text>
              </View>
              <Text style={styles.body}>{n.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  group: { fontFamily: Font.display, fontSize: 20, color: Palette.ink, marginBottom: Spacing.xs },
  card: { flexDirection: 'row', gap: Spacing.md, backgroundColor: Palette.surface, borderRadius: Radius.card, padding: Spacing.lg, ...Shadow.soft },
  iconChip: { width: 46, height: 46, borderRadius: Radius.chip, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: Font.displaySemi, fontSize: 17, color: Palette.ink, flex: 1 },
  time: { fontFamily: Font.regular, fontSize: 13, color: Palette.mistLight, marginLeft: Spacing.sm },
  body: { fontFamily: Font.regular, fontSize: 15, color: Palette.mist, marginTop: 3 },
});
