import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import BrandLogo from '@/components/brand-logo';
import LiveMap from '@/components/live-map';
import { fs } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { finishOnboarding } from '@/data/app-store';
import { STATIONS } from '@/data/mock';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SCAN_PHOTO = require('@/assets/images/onboarding-scan.jpg');

const SLIDES = [
  {
    title: 'Find a charger\nnear you',
    body: 'See which EVIT stations are free right now, how fast they charge and how far away they are.',
  },
  {
    title: 'Scan, plug in,\ncharge',
    body: 'Scan the QR code on any EVIT charger, plug in, and follow your charge live.',
  },
  {
    title: 'Pay only for\nwhat you use',
    body: 'Pay per kWh with UPI or card, and get a receipt after every charge.',
  },
];
const LAST = SLIDES.length - 1;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Endless 0→1 loop that stops on unmount (and never runs with reduced motion). */
function useLoop(duration: number, reverse = false) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration, easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear }), -1, reverse);
    return () => cancelAnimation(t);
    // shared value is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
  return t;
}

/** Fades a slide's content in as it reaches the centre, with a little parallax. */
function Layer({
  scrollX,
  index,
  width,
  depth,
  style,
  children,
}: {
  scrollX: SharedValue<number>;
  index: number;
  width: number;
  depth: number;
  style?: object;
  children: React.ReactNode;
}) {
  const a = useAnimatedStyle(() => {
    const offset = index * width - scrollX.value; // 0 when this slide is centred
    return {
      opacity: interpolate(Math.abs(offset), [0, width * 0.8], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: offset * depth }],
    };
  });
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

// ---------- slide 1: the real map with every EVIT station ----------

const ONBOARDING_PINS = STATIONS.map((st) => ({
  id: st.id,
  latitude: st.latitude,
  longitude: st.longitude,
  available: st.status === 'Available',
}));

function MapVisual() {
  return (
    <>
      <LiveMap pins={ONBOARDING_PINS} interactive={false} animatePins padding={{ top: 70, bottom: 80, left: 50, right: 50 }} />
      <View style={styles.legend} pointerEvents="none">
        <View style={[styles.legendSwatch, { backgroundColor: Palette.volt }]} />
        <Text style={styles.legendText}>Free</Text>
        <View style={[styles.legendSwatch, { backgroundColor: '#8E9A92', marginLeft: Spacing.md }]} />
        <Text style={styles.legendText}>In use</Text>
      </View>
    </>
  );
}

// ---------- slide 2: scanning the QR on an EVIT charger ----------

// One loop (t: 0→1 every SCAN_LOOP ms): the scan line sweeps while the code
// assembles (0–.38), the frame locks green (.40), "Charger found" (.44–.92).
const SCAN_LOOP = 4200;
const QR = ['111010111', '101101101', '111011111', '000110100', '101011010', '010100111', '111001010', '101110011', '111010110'];
const CELL = 11;
const GAP = 1.5;
const QR_SIZE = QR.length * (CELL + GAP) - GAP;
const FRAME = QR_SIZE + 44;
const QR_CELLS = QR.flatMap((row, r) => [...row].flatMap((c, col) => (c === '1' ? [{ r, col }] : [])));

function QrCell({ c, t }: { c: (typeof QR_CELLS)[number]; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const sweep = Math.min(t.value / 0.38, 1);
    const at = (c.r + 0.5) / QR.length;
    const on = Math.min(Math.max((sweep - at) * 8, 0), 1);
    return { opacity: on * interpolate(t.value, [0.92, 0.98], [1, 0], Extrapolation.CLAMP) };
  });
  return <Animated.View style={[styles.qrCell, { left: c.col * (CELL + GAP), top: c.r * (CELL + GAP) }, style]} />;
}

function ScanVisual() {
  const t = useLoop(SCAN_LOOP);
  const line = useAnimatedStyle(() => {
    const sweep = Math.min(t.value / 0.38, 1);
    return {
      opacity: interpolate(t.value, [0, 0.03, 0.36, 0.4], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: -QR_SIZE / 2 + sweep * QR_SIZE }],
    };
  });
  const locked = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.38, 0.42, 0.92, 0.98], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(t.value, [0.38, 0.42, 0.46], [1.08, 0.97, 1], Extrapolation.CLAMP) }],
  }));
  const found = useAnimatedStyle(() => {
    const v = interpolate(t.value, [0.44, 0.5, 0.9, 0.96], [0, 1, 1, 0], Extrapolation.CLAMP);
    return { opacity: v, transform: [{ translateY: (1 - v) * 12 }] };
  });

  return (
    <>
      <Image source={SCAN_PHOTO} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" />
      <LinearGradient colors={['rgba(6,20,12,0.25)', 'rgba(6,20,12,0.55)']} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <View style={styles.viewfinder}>
          <View style={{ width: QR_SIZE, height: QR_SIZE }}>
            {QR_CELLS.map((c, i) => (
              <QrCell key={i} c={c} t={t} />
            ))}
          </View>
          {/* white corners while searching, green once locked */}
          <View style={[StyleSheet.absoluteFill, styles.corners]}>
            <Corners color="rgba(255,255,255,0.95)" />
          </View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.corners, locked]}>
            <Corners color={Palette.volt} />
          </Animated.View>
          <Animated.View style={[styles.scanLine, line]} />
        </View>
      </View>
      <Animated.View style={[styles.foundPill, found]}>
        <View style={styles.foundIcon}>
          <Ionicons name="checkmark" size={14} color={Palette.white} />
        </View>
        <View>
          <Text style={styles.foundTitle}>Charger found</Text>
          <Text style={styles.foundSub}>EVIT-05 · Type 2 · 7.4 kW</Text>
        </View>
      </Animated.View>
    </>
  );
}

function Corners({ color }: { color: string }) {
  return (
    <>
      <View style={[styles.corner, styles.cTL, { borderColor: color }]} />
      <View style={[styles.corner, styles.cTR, { borderColor: color }]} />
      <View style={[styles.corner, styles.cBL, { borderColor: color }]} />
      <View style={[styles.corner, styles.cBR, { borderColor: color }]} />
    </>
  );
}

// ---------- slide 3: pay per kWh ----------

const METER = 196;
const METER_R = 86;
const METER_C = 2 * Math.PI * METER_R;
const METHODS = [
  { icon: 'cellphone', label: 'UPI' },
  { icon: 'credit-card-outline', label: 'Card' },
  { icon: 'receipt-text-outline', label: 'Receipt' },
] as const;

function PayVisual() {
  const fill = useLoop(5200);
  const float = useLoop(3000, true);
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: METER_C * (1 - interpolate(fill.value, [0, 0.75, 1], [0.08, 0.92, 0.92], Extrapolation.CLAMP)),
  }));
  const coin = useAnimatedStyle(() => ({ transform: [{ translateY: -4 + float.value * 8 }] }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.center]}>
      <View style={styles.center}>
        <Svg width={METER} height={METER} style={StyleSheet.absoluteFill}>
          <Circle cx={METER / 2} cy={METER / 2} r={METER_R} stroke={Palette.brandTint2} strokeWidth={8} fill="none" />
          <AnimatedCircle
            cx={METER / 2}
            cy={METER / 2}
            r={METER_R}
            stroke={Palette.volt}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${METER_C} ${METER_C}`}
            animatedProps={ringProps}
            fill="none"
            transform={`rotate(-90 ${METER / 2} ${METER / 2})`}
          />
        </Svg>
        <View style={{ width: METER, height: METER, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={coin}>
            <LinearGradient colors={Palette.gradForest} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.coin}>
              <Text style={styles.coinSymbol}>₹</Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
      <View style={styles.kwhPill}>
        <Ionicons name="flash" size={13} color={Palette.forest} />
        <Text style={styles.kwhText}>Billed per kWh</Text>
      </View>
      <View style={styles.methods}>
        {METHODS.map((m) => (
          <View key={m.label} style={styles.method}>
            <MaterialCommunityIcons name={m.icon} size={18} color={Palette.forest} />
            <Text style={styles.methodText}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- progress ----------

function Progress({ i, scrollX, width }: { i: number; scrollX: SharedValue<number>; width: number }) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(scrollX.value / width, [i - 1, i], [0, 100], Extrapolation.CLAMP)}%`,
  }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.trackFill, fillStyle]} />
    </View>
  );
}

// ---------- screen ----------

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const leaving = useRef(false);

  const visualH = Math.min(height * 0.5, 440);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });
  useAnimatedReaction(
    () => Math.round(scrollX.value / width),
    (v, prev) => {
      if (v !== prev) runOnJS(setIndex)(v);
    },
  );

  const finish = () => {
    if (leaving.current) return;
    leaving.current = true;
    finishOnboarding();
    router.replace('/login');
  };
  const next = () => {
    if (index >= LAST) return finish();
    // a plain JS scroll: Reanimated's scrollTo only works from the UI thread
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.topBar}>
        <BrandLogo height={40} />
        {index < LAST ? (
          <TouchableOpacity onPress={finish} hitSlop={12} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}>
        {SLIDES.map((sl, i) => (
          <View key={i} style={{ width, paddingHorizontal: Spacing.xl }}>
            <View style={[styles.visual, { height: visualH }, i === 2 && styles.visualSoft]}>
              {i === 0 ? <MapVisual /> : null}
              {i === 1 ? <ScanVisual /> : null}
              {i === 2 ? <PayVisual /> : null}
            </View>
            <Layer scrollX={scrollX} index={i} width={width} depth={0.12}>
              <Text style={styles.step}>
                {i + 1} of {SLIDES.length}
              </Text>
              <Text style={styles.title}>{sl.title}</Text>
              <Text style={styles.body}>{sl.body}</Text>
            </Layer>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.progress}>
          {SLIDES.map((_, i) => (
            <Progress key={i} i={i} scrollX={scrollX} width={width} />
          ))}
        </View>
        <Pressable onPress={next} accessibilityRole="button" accessibilityLabel={index >= LAST ? 'Get started' : 'Next'} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <LinearGradient colors={Palette.gradForest} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>{index >= LAST ? 'Get started' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={20} color={Palette.white} style={styles.ctaArrow} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  skip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  skipText: { fontFamily: Font.semibold, fontSize: fs(14), color: Palette.inkSoft },

  visual: {
    borderRadius: Radius.hero,
    overflow: 'hidden',
    backgroundColor: Palette.canvasDeep,
    ...Shadow.lift,
  },
  visualSoft: { backgroundColor: Palette.voltSofter, borderWidth: 1, borderColor: Palette.brandTint2 },
  step: { fontFamily: Font.semibold, fontSize: fs(13), color: Palette.forest, marginTop: Spacing.xxl },
  title: {
    fontFamily: Font.display,
    fontSize: fs(30),
    lineHeight: fs(36),
    color: Palette.ink,
    marginTop: Spacing.sm,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: fs(16),
    lineHeight: fs(23),
    color: Palette.mist,
    marginTop: Spacing.md,
    maxWidth: 340,
  },

  // map
  legend: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...Shadow.soft,
  },
  legendSwatch: { width: 14, height: 10, borderRadius: 3 },
  legendText: { fontFamily: Font.semibold, fontSize: fs(12), color: Palette.inkSoft },

  // scan
  viewfinder: { width: FRAME, height: FRAME, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)' },
  qrCell: { position: 'absolute', width: CELL, height: CELL, borderRadius: 2.5, backgroundColor: Palette.ink },
  corners: { margin: -10 },
  corner: { position: 'absolute', width: 34, height: 34 },
  cTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  cTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  scanLine: { position: 'absolute', width: QR_SIZE + 16, height: 3, borderRadius: 2, backgroundColor: Palette.volt, ...Shadow.volt },
  foundPill: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.surface,
    borderRadius: 18,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Shadow.lift,
  },
  foundIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Palette.volt, alignItems: 'center', justifyContent: 'center' },
  foundTitle: { fontFamily: Font.bold, fontSize: fs(14), color: Palette.ink },
  foundSub: { fontFamily: Font.medium, fontSize: fs(12), color: Palette.mist, marginTop: 1 },

  // pay
  coin: { width: 124, height: 124, borderRadius: 62, alignItems: 'center', justifyContent: 'center', ...Shadow.volt },
  coinSymbol: { fontFamily: Font.display, fontSize: fs(58), lineHeight: fs(68), color: Palette.white },
  kwhPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.lg,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Shadow.soft,
  },
  kwhText: { fontFamily: Font.bold, fontSize: fs(13), color: Palette.forest },
  methods: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  methodText: { fontFamily: Font.semibold, fontSize: fs(13), color: Palette.ink },

  // footer
  footer: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  progress: { flexDirection: 'row', gap: 6 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Palette.line, overflow: 'hidden' },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: Palette.volt },
  cta: { height: 56, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', ...Shadow.volt },
  ctaText: { fontFamily: Font.semibold, fontSize: fs(17), color: Palette.white },
  ctaArrow: { position: 'absolute', right: Spacing.xxl },
});
