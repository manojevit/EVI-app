import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';

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

/** Floating tab bar — active tab expands into a gradient pill with its label. */
export default function BottomTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = ICONS[route.name];
          if (!icon) return null;

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          if (focused) {
            return (
              <TouchableOpacity key={route.key} activeOpacity={0.9} onPress={onPress} style={styles.activeWrap}>
                <LinearGradient
                  colors={Palette.gradForest}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activePill}>
                  <Ionicons name={icon.on} size={20} color={Palette.white} />
                  <Text style={styles.activeLabel}>{LABELS[route.name]}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} activeOpacity={0.8} onPress={onPress} style={styles.tab}>
              <Ionicons name={icon.off} size={23} color={Palette.mistLight} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', backgroundColor: 'transparent' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    ...Shadow.lift,
  },
  tab: { width: 52, height: 48, alignItems: 'center', justifyContent: 'center' },
  activeWrap: { borderRadius: Radius.pill },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
  },
  activeLabel: { fontFamily: Font.bold, color: Palette.white, fontSize: 15 },
});
