import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import AppHeader from '@/components/app-header';
import { Font, Palette, Spacing } from '@/constants/theme';

/** Placeholder screen for prototype-depth routes not yet designed. */
export default function StubScreen({
  icon,
  title,
  note,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  note: string;
}) {
  return (
    <View style={styles.container}>
      <AppHeader back />
      <View style={styles.body}>
        <View style={styles.circle}>
          <Ionicons name={icon} size={38} color={Palette.forest} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>{note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  circle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  title: { fontFamily: Font.display, fontSize: 24, color: Palette.ink, marginBottom: Spacing.sm },
  note: { fontFamily: Font.regular, fontSize: 16, color: Palette.mist, textAlign: 'center', lineHeight: 23 },
});
