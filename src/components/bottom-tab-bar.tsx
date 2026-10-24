import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Palette, Radius, Spacing } from '@/constants/theme';
import { scaledSheet } from '@/constants/responsive';

type TabRoute = { key: string; name: string };
type BottomTabBarProps = {
  state: { index: number; routes: TabRoute[] };
  emitter: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
  };
  navigateToTab: (routeKey: string) => void;
};

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  map: { on: 'map', off: 'map-outline' },
  sessions: { on: 'flash', off: 'flash-outline' },
  account: { on: 'person', off: 'person-outline' },
};
const LABELS: Record<string, string> = { map: 'Map', sessions: 'Charging', account: 'Account' };

/**
 * Full-width bar docked to the bottom. It sits in the layout (not floating), so screens
 * end above it and nothing scrolls behind it. The active tab gets a green pill and bold label.
 */
export default function BottomTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const icon = ICONS[route.name];
        if (!icon) return null;

        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[route.name]}>
            <View style={[styles.pill, focused && styles.pillOn]}>
              <Ionicons name={focused ? icon.on : icon.off} size={22} color={focused ? Palette.white : Palette.mist} />
            </View>
            <Text style={[styles.label, focused && styles.labelOn]}>{LABELS[route.name]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = scaledSheet({
  bar: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
    shadowColor: '#0B2416',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  pill: { width: 58, height: 32, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: Palette.forest },
  label: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },
  labelOn: { fontFamily: Font.bold, color: Palette.forest },
});
