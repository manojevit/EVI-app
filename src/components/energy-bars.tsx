import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Palette } from '@/constants/theme';

/**
 * Segmented energy bars — a live "power flow" motif. Heights vary like a
 * signal; filled bars use the lime→volt energy ramp, the rest sit quiet.
 */
const PATTERN = [0.35, 0.55, 0.78, 1, 0.82, 0.6, 0.95, 0.7, 0.45, 0.85, 0.65, 0.5];

export default function EnergyBars({
  width = 300,
  height = 46,
  filled = 0.7,
}: {
  width?: number;
  height?: number;
  filled?: number;
}) {
  const n = PATTERN.length;
  const gap = 6;
  const bw = (width - gap * (n - 1)) / n;
  const activeCount = Math.round(filled * n);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="bars" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={Palette.volt} />
          <Stop offset="1" stopColor={Palette.gradEnergy[0]} />
        </LinearGradient>
      </Defs>
      {PATTERN.map((h, i) => {
        const bh = Math.max(6, h * height);
        const active = i < activeCount;
        return (
          <Rect
            key={i}
            x={i * (bw + gap)}
            y={height - bh}
            width={bw}
            height={bh}
            rx={bw / 2}
            fill={active ? 'url(#bars)' : Palette.voltSoft}
          />
        );
      })}
    </Svg>
  );
}

export function MiniBars({ color = Palette.forest }: { color?: string }) {
  const heights = [8, 14, 11, 18, 13];
  return (
    <View style={styles.mini}>
      {heights.map((h, i) => (
        <View key={i} style={[styles.miniBar, { height: h, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mini: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 18 },
  miniBar: { width: 3, borderRadius: 2 },
});
