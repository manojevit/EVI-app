import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Palette } from '@/constants/theme';

/**
 * Signature charge ring: a gradient radial progress arc with a soft glow.
 * The energy motif the whole app is built around.
 */
export default function ChargeRing({
  size = 240,
  progress = 0.62,
  strokeWidth = 16,
  trackColor = Palette.voltSoft,
  children,
}: {
  size?: number;
  progress?: number;
  strokeWidth?: number;
  trackColor?: string;
  children?: ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * c;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* glow halo */}
      <View
        style={[
          styles.glow,
          { width: size * 0.8, height: size * 0.8, borderRadius: size },
        ]}
      />
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={Palette.gradEnergy[0]} />
            <Stop offset="1" stopColor={Palette.gradEnergy[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', backgroundColor: Palette.volt, opacity: 0.18 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
