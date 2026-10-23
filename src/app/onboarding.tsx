import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import BrandLogo from '@/components/brand-logo';
import OnboardingMap from '@/components/onboarding-map';
import { projectFromCenter } from '@/constants/map-style';
import { fs } from '@/constants/responsive';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { STATIONS } from '@/data/mock';

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
const BTN = 64;
const BTN_R = 25; // progress ring sits inside the button
const BTN_C = 2 * Math.PI * BTN_R;

/** Starts an endless 0→1 loop (optionally ping-pong) and stops it on unmount. */
function useLoop(duration: number, { reverse = false, delay = 0 } = {}) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear,
        }),
        -1,
        reverse,
      ),
    );
    return () => cancelAnimation(t);
    // shared value is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
  return t;
}

/** A layer that drifts faster/slower than the page while swiping (depth). */
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
      opacity: interpolate(Math.abs(offset), [0, width * 0.75], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: offset * depth }],
    };
  });
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

// ---------- slide 1: real map + live pins ----------

function MapPin({ x, y, order, available }: { x: number; y: number; order: number; available: boolean }) {
  const drop = useSharedValue(0);
  const pulse = useLoop(1800, { delay: order * 260 });
  useEffect(() => {
    drop.value = withDelay(250 + order * 110, withSpring(1, { damping: 11, stiffness: 180 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pinStyle = useAnimatedStyle(() => ({
    opacity: Math.min(drop.value * 2, 1),
    transform: [{ translateY: (1 - drop.value) * -26 }, { scale: 0.6 + drop.value * 0.4 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: available ? (1 - pulse.value) * 0.45 * Math.min(drop.value, 1) : 0,
    transform: [{ scale: 0.5 + pulse.value * 1.5 }],
  }));
  return (
    // the pin's tip sits exactly on (x, y)
    <View style={[styles.pinAnchor, { transform: [{ translateX: x }, { translateY: y - PIN_H / 2 }] }]} pointerEvents="none">
      <Animated.View style={[styles.pinPulse, ringStyle]} />
      <Animated.View style={[styles.pinCol, pinStyle]}>
        <View style={[styles.pin, !available && styles.pinOff]}>
          <MaterialCommunityIcons name="ev-station" size={16} color={available ? Palette.forest : Palette.mistLight} />
        </View>
        <View style={[styles.pinStem, !available && styles.pinStemOff]} />
      </Animated.View>
    </View>
  );
}

function MapVisual({ scrollX, width }: { scrollX: SharedValue<number>; width: number }) {
  return (
    <>
      <Layer scrollX={scrollX} index={0} width={width} depth={0.2} style={StyleSheet.absoluteFill}>
        <OnboardingMap />
      </Layer>
      <Layer scrollX={scrollX} index={0} width={width} depth={0.32} style={[StyleSheet.absoluteFill, styles.center]}>
        {STATIONS.map((s, i) => {
          const { x, y } = projectFromCenter(s.latitude, s.longitude);
          return <MapPin key={s.id} x={x} y={y} order={i} available={s.status === 'Available'} />;
        })}
      </Layer>
    </>
  );
}

// ---------- slide 2: scan the charger QR ----------

// One looping story on the phone (t: 0→1 every SCAN_LOOP ms):
// 0–.32 the scan line sweeps and the QR assembles from scattered pieces ·
// .34 lock: frame snaps, green flash, shockwave, "Charger found" ·
// .50 the QR hands over to a charging ring that fills · .92 everything fades and it repeats.
const SCAN_LOOP = 4600;
const QR = ['111010111', '101101101', '111011111', '000110100', '101011010', '010100111', '111001010', '101110011', '111010110'];
const QR_CELL = 10;
const QR_GAP = 1;
const QR_SIZE = QR.length * (QR_CELL + QR_GAP) - QR_GAP;
const QR_CELLS = QR.flatMap((row, r) =>
  [...row].flatMap((c, col) =>
    c === '1'
      ? [
          {
            r,
            col,
            dx: Math.sin(r * 7.1 + col * 3.3) * 0.5 * 34,
            dy: Math.cos(r * 4.7 + col * 5.9) * 0.5 * 34,
          },
        ]
      : [],
  ),
);
const SCAN_RING = 92;
const SCAN_R = 40;
const SCAN_C = 2 * Math.PI * SCAN_R;

function QrCell({ c, t }: { c: (typeof QR_CELLS)[number]; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const sweep = Math.min(t.value / 0.32, 1);
    const rowAt = (c.r + 0.5) / QR.length;
    const inP = Math.min(Math.max((sweep - rowAt) * 6, 0), 1); // assembles just after the line passes
    const out = interpolate(t.value, [0.5, 0.56], [1, 0], Extrapolation.CLAMP);
    const e = 1 - (1 - inP) * (1 - inP);
    return {
      opacity: inP * out,
      transform: [{ translateX: (1 - e) * c.dx }, { translateY: (1 - e) * c.dy }, { scale: 0.4 + e * 0.6 }],
    };
  });
  return <Animated.View style={[styles.qrCell, { left: c.col * (QR_CELL + QR_GAP), top: c.r * (QR_CELL + QR_GAP) }, style]} />;
}

/** A badge circling the phone on an ellipse, with a fading motion trail behind it. */
function OrbitingBadge({
  orbit,
  phase,
  a,
  b,
  children,
}: {
  orbit: SharedValue<number>;
  phase: number;
  a: number;
  b: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <TrailDot orbit={orbit} phase={phase} a={a} b={b} k={3} />
      <TrailDot orbit={orbit} phase={phase} a={a} b={b} k={2} />
      <TrailDot orbit={orbit} phase={phase} a={a} b={b} k={1} />
      <TrailDot orbit={orbit} phase={phase} a={a} b={b} k={0}>
        {children}
      </TrailDot>
    </>
  );
}

/** k = 0 is the badge itself; k ≥ 1 are fading dots lagging behind it on the ellipse. */
function TrailDot({
  orbit,
  phase,
  a,
  b,
  k,
  children,
}: {
  orbit: SharedValue<number>;
  phase: number;
  a: number;
  b: number;
  k: number;
  children?: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const th = orbit.value * Math.PI * 2 + phase - k * 0.13;
    return {
      opacity: k === 0 ? 1 : 0.32 - k * 0.08,
      transform: [{ translateX: Math.cos(th) * a }, { translateY: Math.sin(th) * b }, { scale: 1 - k * 0.14 }],
    };
  });
  return <Animated.View style={[styles.abs, k > 0 && styles.trailDot, style]}>{children}</Animated.View>;
}

function ScanVisual({ scrollX, width, panelH }: { scrollX: SharedValue<number>; width: number; panelH: number }) {
  const t = useLoop(SCAN_LOOP);
  const orbit = useLoop(7000);
  const k = Math.min(1, (panelH - 64) / 276); // phone scale for short screens
  const a = 78 * k + 56;
  const b = 138 * k + 42;

  // 3D tilt that follows the swipe, plus a slow idle sway
  const phoneStyle = useAnimatedStyle(() => {
    const off = (width - scrollX.value) / width; // 0 when centred
    return {
      transform: [
        { perspective: 900 },
        {
          rotateY: `${-off * 38 + Math.sin(orbit.value * Math.PI * 2) * 6}deg`,
        },
        { rotateX: `${Math.cos(orbit.value * Math.PI * 2) * 4}deg` },
        { rotateZ: '-4deg' },
        { scale: k },
      ],
    };
  });
  const scanLine = useAnimatedStyle(() => {
    const sweep = Math.min(t.value / 0.32, 1);
    return {
      opacity: interpolate(t.value, [0, 0.02, 0.33, 0.37], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: -QR_SIZE / 2 - 8 + sweep * (QR_SIZE + 16) }],
    };
  });
  const frame = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.03, 0.5, 0.56], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(t.value, [0.33, 0.37, 0.4], [1.14, 0.96, 1], Extrapolation.CLAMP),
      },
    ],
  }));
  const flash = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.34, 0.36, 0.48], [0, 0.5, 0], Extrapolation.CLAMP),
  }));
  const shock = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.34, 0.36, 0.62], [0, 0.55, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(t.value, [0.34, 0.62], [0.5, 2.1], Extrapolation.CLAMP),
      },
    ],
  }));
  const found = useAnimatedStyle(() => {
    const v = interpolate(t.value, [0.37, 0.42, 0.88, 0.92], [0, 1, 1, 0], Extrapolation.CLAMP);
    return { opacity: v, transform: [{ translateY: (1 - v) * 10 }] };
  });
  const ring = useAnimatedStyle(() => {
    const v = interpolate(t.value, [0.5, 0.57, 0.88, 0.94], [0, 1, 1, 0], Extrapolation.CLAMP);
    return { opacity: v, transform: [{ scale: 0.7 + v * 0.3 }] };
  });
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: SCAN_C * (1 - interpolate(t.value, [0.55, 0.9], [0, 0.86], Extrapolation.CLAMP)),
  }));

  return (
    <>
      <Layer scrollX={scrollX} index={1} width={width} depth={0.1} style={[StyleSheet.absoluteFill, styles.center]}>
        {[340, 260].map((d) => (
          <View key={d} style={[styles.halo, { width: d, height: d, borderRadius: d / 2 }]} />
        ))}
        <Animated.View style={[styles.abs, styles.scanShock, shock]} />
      </Layer>

      <Layer scrollX={scrollX} index={1} width={width} depth={0.35} style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View style={[styles.phone, phoneStyle]}>
          <View style={styles.notch} />
          <View style={styles.phoneScreen}>
            <View style={styles.qrStage}>
              {/* QR assembling under the scan line */}
              <View style={{ width: QR_SIZE, height: QR_SIZE }}>
                {QR_CELLS.map((c, i) => (
                  <QrCell key={i} c={c} t={t} />
                ))}
              </View>
              <Animated.View style={[styles.abs, styles.finder, frame]}>
                <View style={[styles.corner, styles.cTL]} />
                <View style={[styles.corner, styles.cTR]} />
                <View style={[styles.corner, styles.cBL]} />
                <View style={[styles.corner, styles.cBR]} />
              </Animated.View>
              <Animated.View style={[styles.scanLine, scanLine]} />

              {/* charging ring takes over after the lock */}
              <Animated.View style={[styles.abs, ring]}>
                <Svg width={SCAN_RING} height={SCAN_RING}>
                  <Circle cx={SCAN_RING / 2} cy={SCAN_RING / 2} r={SCAN_R} stroke={Palette.voltSoft} strokeWidth={7} fill="none" />
                  <AnimatedCircle
                    cx={SCAN_RING / 2}
                    cy={SCAN_RING / 2}
                    r={SCAN_R}
                    stroke={Palette.volt}
                    strokeWidth={7}
                    strokeLinecap="round"
                    strokeDasharray={`${SCAN_C} ${SCAN_C}`}
                    animatedProps={ringProps}
                    fill="none"
                    transform={`rotate(-90 ${SCAN_RING / 2} ${SCAN_RING / 2})`}
                  />
                </Svg>
                <View style={[StyleSheet.absoluteFill, styles.center]}>
                  <Ionicons name="flash" size={30} color={Palette.volt} />
                </View>
              </Animated.View>
            </View>

            <Animated.View style={[styles.foundPill, found]}>
              <Ionicons name="checkmark-circle" size={14} color={Palette.white} />
              <Text style={styles.foundText}>Charger found</Text>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, flash]} />
          </View>
        </Animated.View>
      </Layer>

      <Layer scrollX={scrollX} index={1} width={width} depth={0.6} style={[StyleSheet.absoluteFill, styles.center]}>
        <OrbitingBadge orbit={orbit} phase={-0.9} a={a} b={b}>
          <LinearGradient colors={Palette.gradVolt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plugBadge}>
            <MaterialCommunityIcons name="ev-plug-type2" size={28} color={Palette.white} />
          </LinearGradient>
        </OrbitingBadge>
        <OrbitingBadge orbit={orbit} phase={Math.PI - 0.9} a={a} b={b}>
          <View style={styles.boltBadge}>
            <Ionicons name="flash" size={22} color={Palette.forest} />
          </View>
        </OrbitingBadge>
      </Layer>
    </>
  );
}

// ---------- slide 3: pay per kWh ----------

const ORBIT = 244;
const PAY_METHODS = [
  { icon: 'cellphone', label: 'UPI' },
  { icon: 'credit-card-outline', label: 'Card' },
  { icon: 'receipt-text-outline', label: 'Receipt' },
] as const;
const SPARKLES = [
  { x: -78, y: -70, s: 1, d: 0 },
  { x: 82, y: -40, s: 0.7, d: 0.33 },
  { x: 64, y: 78, s: 0.85, d: 0.66 },
];

function OrbitBadge({ i, spin }: { i: number; spin: SharedValue<number> }) {
  const base = (i / PAY_METHODS.length) * 360;
  const m = PAY_METHODS[i];
  // counter-rotate so the badge and its label stay upright while the ring turns
  const upright = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-(base + spin.value * 360)}deg` }],
  }));
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: `${base}deg` }] }]} pointerEvents="none">
      <View style={{ transform: [{ translateY: -ORBIT / 2 }] }}>
        <Animated.View style={[styles.center, upright]}>
          <View style={styles.orbitBadge}>
            <MaterialCommunityIcons name={m.icon} size={24} color={Palette.forest} />
          </View>
          <Text style={styles.orbitLabel}>{m.label}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function Sparkle({ x, y, s, d, twinkle }: (typeof SPARKLES)[number] & { twinkle: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = (twinkle.value + d) % 1;
    const v = Math.sin(p * Math.PI);
    return {
      opacity: v,
      transform: [{ translateX: x }, { translateY: y }, { scale: s * (0.5 + v * 0.6) }, { rotate: `${p * 90}deg` }],
    };
  });
  return (
    <Animated.View style={[styles.abs, style]}>
      <MaterialCommunityIcons name="star-four-points" size={18} color={Palette.volt} />
    </Animated.View>
  );
}

function PayVisual({ scrollX, width }: { scrollX: SharedValue<number>; width: number }) {
  const spin = useLoop(16000);
  const wobble = useLoop(2600, { reverse: true });
  const glow = useLoop(2200);
  const twinkle = useLoop(2400);
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${-18 + wobble.value * 36}deg` }, { translateY: -5 + wobble.value * 10 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - glow.value),
    transform: [{ scale: 1 + glow.value * 0.45 }],
  }));
  return (
    <>
      <Layer scrollX={scrollX} index={2} width={width} depth={0.25} style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View style={[styles.orbit, orbitStyle]}>
          {PAY_METHODS.map((_, i) => (
            <OrbitBadge key={i} i={i} spin={spin} />
          ))}
        </Animated.View>
      </Layer>
      <Layer scrollX={scrollX} index={2} width={width} depth={0.55} style={[StyleSheet.absoluteFill, styles.center]}>
        {SPARKLES.map((sp, i) => (
          <Sparkle key={i} {...sp} twinkle={twinkle} />
        ))}
        <Animated.View style={coinStyle}>
          {/* glow pulses out from behind the coin and moves with it */}
          <Animated.View style={[styles.abs, styles.coinGlow, glowStyle]} />
          <LinearGradient colors={Palette.gradForest} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.coin}>
            <LinearGradient
              colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={styles.coinGloss}
            />
            <View style={styles.coinRing} />
            <Text style={styles.coinSymbol}>₹</Text>
          </LinearGradient>
        </Animated.View>
        <View style={styles.kwhPill}>
          <Ionicons name="flash" size={13} color={Palette.forest} />
          <Text style={styles.kwhText}>per kWh</Text>
        </View>
      </Layer>
    </>
  );
}

// ---------- pagination + next ----------

function Dot({ i, scrollX, width }: { i: number; scrollX: SharedValue<number>; width: number }) {
  const s = useAnimatedStyle(() => {
    const d = Math.abs(scrollX.value / width - i);
    return {
      width: interpolate(d, [0, 1], [26, 8], Extrapolation.CLAMP),
      opacity: interpolate(d, [0, 1], [1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, s]} />;
}

function NextButton({ scrollX, width, onPress }: { scrollX: SharedValue<number>; width: number; onPress: () => void }) {
  const ringProps = useAnimatedProps(() => {
    const progress = interpolate(scrollX.value / width, [0, LAST], [1 / SLIDES.length, 1], Extrapolation.CLAMP);
    return { strokeDashoffset: BTN_C * (1 - progress) };
  });
  const morph = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value / width, [LAST - 1, LAST], [BTN, 176], Extrapolation.CLAMP),
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value / width, [LAST - 1, LAST - 0.4], [1, 0], Extrapolation.CLAMP),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value / width, [LAST - 0.35, LAST], [0, 1], Extrapolation.CLAMP),
    maxWidth: interpolate(scrollX.value / width, [LAST - 0.6, LAST], [0, 120], Extrapolation.CLAMP),
  }));

  // on the last slide a soft halo pulses out of "Get started" so the next step is obvious
  const pulse = useLoop(1700);
  const haloStyle = useAnimatedStyle(() => {
    const onLast = interpolate(scrollX.value / width, [LAST - 0.5, LAST], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: (1 - pulse.value) * 0.4 * onLast,
      transform: [{ scaleX: 1 + pulse.value * 0.12 }, { scaleY: 1 + pulse.value * 0.4 }],
    };
  });

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Next">
      <Animated.View style={[styles.nextOuter, morph]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.nextHalo, haloStyle]} />
        <View style={styles.nextWrap}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.ringBox, ringStyle]} pointerEvents="none">
            <Svg width={BTN} height={BTN}>
              <Circle cx={BTN / 2} cy={BTN / 2} r={BTN_R} stroke="rgba(255,255,255,0.22)" strokeWidth={3} fill="none" />
              <AnimatedCircle
                cx={BTN / 2}
                cy={BTN / 2}
                r={BTN_R}
                stroke={Palette.white}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={`${BTN_C} ${BTN_C}`}
                animatedProps={ringProps}
                fill="none"
                transform={`rotate(-90 ${BTN / 2} ${BTN / 2})`}
              />
            </Svg>
          </Animated.View>
          <View style={styles.nextInner}>
            <Animated.Text numberOfLines={1} style={[styles.nextLabel, labelStyle]}>
              Get started
            </Animated.Text>
            <Ionicons name="arrow-forward" size={22} color={Palette.white} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
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

  const visualH = Math.min(height * 0.52, 450);

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
    router.replace('/login');
  };
  const next = () => {
    if (index >= LAST) return finish();
    scrollTo(scrollRef, (index + 1) * width, 0, true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.topBar}>
        <BrandLogo height={36} />
        {index < LAST ? (
          <TouchableOpacity onPress={finish} hitSlop={12}>
            <Text style={styles.skip}>Skip</Text>
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
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width, paddingHorizontal: Spacing.xxl }}>
            <LinearGradient
              colors={Palette.gradHero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.visual, { height: visualH }]}>
              {i === 0 ? <MapVisual scrollX={scrollX} width={width} /> : null}
              {i === 1 ? <ScanVisual scrollX={scrollX} width={width} panelH={visualH} /> : null}
              {i === 2 ? <PayVisual scrollX={scrollX} width={width} /> : null}
            </LinearGradient>
            <Layer scrollX={scrollX} index={i} width={width} depth={0.15}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </Layer>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} i={i} scrollX={scrollX} width={width} />
          ))}
        </View>
        <NextButton scrollX={scrollX} width={width} onPress={next} />
      </View>
    </View>
  );
}

const PIN = 30;
const PIN_H = PIN + 6;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  skip: { fontFamily: Font.semibold, fontSize: fs(15), color: Palette.mist },

  visual: {
    borderRadius: Radius.hero,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    overflow: 'hidden',
  },
  title: {
    fontFamily: Font.display,
    fontSize: fs(32),
    lineHeight: fs(38),
    color: Palette.ink,
    marginTop: Spacing.xxl,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: fs(16),
    lineHeight: fs(23),
    color: Palette.mist,
    marginTop: Spacing.md,
    maxWidth: 330,
  },

  // map pins
  pinAnchor: {
    position: 'absolute',
    width: 60,
    height: PIN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCol: { alignItems: 'center' },
  pin: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    backgroundColor: Palette.surface,
    borderWidth: 2.5,
    borderColor: Palette.volt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  pinOff: { borderColor: Palette.mistLight },
  pinStem: {
    width: 3,
    height: 8,
    marginTop: -2,
    borderRadius: 2,
    backgroundColor: Palette.volt,
  },
  pinStemOff: { backgroundColor: Palette.mistLight },
  pinPulse: {
    position: 'absolute',
    top: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.volt,
  },

  // scan
  halo: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: Palette.brandTint2,
    opacity: 0.7,
  },
  phone: {
    width: 156,
    height: 276,
    borderRadius: 32,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    padding: 9,
    ...Shadow.lift,
  },
  abs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  notch: {
    alignSelf: 'center',
    width: 44,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.line,
    marginBottom: 8,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: Palette.voltSofter,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    overflow: 'hidden',
  },
  qrStage: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCell: {
    position: 'absolute',
    width: QR_CELL,
    height: QR_CELL,
    borderRadius: 2,
    backgroundColor: Palette.ink,
  },
  finder: { width: 116, height: 116 },
  flash: { backgroundColor: Palette.volt },
  foundPill: {
    position: 'absolute',
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.volt,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  foundText: { fontFamily: Font.bold, fontSize: fs(11), color: Palette.white },
  scanShock: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: Palette.volt,
  },
  trailDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.volt,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Palette.volt,
  },
  cTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: 'absolute',
    width: 112,
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.volt,
    ...Shadow.volt,
  },
  plugBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.volt,
  },
  boltBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lift,
  },

  // pay
  orbit: {
    width: ORBIT,
    height: ORBIT,
    borderRadius: ORBIT / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Palette.brandTint2,
  },
  orbitLabel: {
    fontFamily: Font.bold,
    fontSize: fs(11),
    color: Palette.forest,
    marginTop: 4,
  },
  orbitBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  coin: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadow.volt,
  },
  coinGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: 74 },
  coinGlow: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: Palette.volt,
  },
  coinRing: {
    position: 'absolute',
    top: 11,
    left: 11,
    right: 11,
    bottom: 11,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  coinSymbol: {
    fontFamily: Font.display,
    fontSize: fs(70),
    lineHeight: fs(82),
    color: Palette.white,
  },
  kwhPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -14,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    ...Shadow.soft,
  },
  kwhText: { fontFamily: Font.bold, fontSize: fs(13), color: Palette.forest },

  // footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  nextOuter: { height: BTN },
  nextHalo: { borderRadius: BTN / 2, backgroundColor: Palette.volt },
  nextWrap: {
    flex: 1,
    borderRadius: BTN / 2,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Shadow.volt,
  },
  ringBox: { alignItems: 'flex-end', justifyContent: 'center' },
  nextInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextLabel: { fontFamily: Font.bold, fontSize: fs(16), color: Palette.white },
});
