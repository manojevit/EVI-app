import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandLogo from '@/components/brand-logo';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { scaledSheet } from '@/constants/responsive';

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  back?: boolean;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightNode?: ReactNode;
}

/** Centered EVIT wordmark header with optional back button and right action. */
export default function AppHeader({ back, rightIcon, onRightPress, rightNode }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.side}>
        {back ? (
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.circleBtn}>
            <Ionicons name="chevron-back" size={24} color={Palette.ink} />
          </TouchableOpacity>
        ) : null}
      </View>

      <BrandLogo height={46} />

      <View style={[styles.side, styles.sideRight, rightNode ? styles.sideWide : null]}>
        {rightNode ? (
          rightNode
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightPress} hitSlop={12} style={styles.circleBtn}>
            <Ionicons name={rightIcon} size={22} color={Palette.ink} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = scaledSheet({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.canvas,
  },
  side: { width: 44, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  sideWide: { width: 86 },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0C3A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});
