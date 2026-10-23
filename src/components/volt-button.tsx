import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { scaledSheet } from '@/constants/responsive';

type Variant = 'forest' | 'volt' | 'danger' | 'outline';

/** Primary action button with the brand gradient and a confident label. */
export default function VoltButton({
  label,
  onPress,
  icon,
  variant = 'forest',
  disabled,
  style,
  iconAtEnd,
}: {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  /** Pin the icon to the button's right edge (e.g. a forward arrow) instead of beside the label. */
  iconAtEnd?: boolean;
}) {
  const outline = variant === 'outline';
  const danger = variant === 'danger';
  const colors =
    variant === 'volt' ? Palette.gradVolt : danger ? (['#F0564A', '#CF2E22'] as const) : Palette.gradForest;
  const fg = outline ? Palette.forest : Palette.white;

  const content = (
    <>
      {icon && !iconAtEnd ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
      {icon && iconAtEnd ? <Ionicons name={icon} size={22} color={fg} style={styles.endIcon} /> : null}
    </>
  );

  if (outline) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={[styles.base, styles.outline, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={disabled} style={[disabled && styles.dim, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.base, danger ? Shadow.soft : Shadow.volt]}>
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = scaledSheet({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.pill,
    paddingVertical: 17,
    paddingHorizontal: Spacing.xl,
  },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Palette.forest },
  label: { fontFamily: Font.bold, fontSize: 17, letterSpacing: 0.2 },
  dim: { opacity: 0.5 },
  endIcon: { position: 'absolute', right: Spacing.xxl },
});
