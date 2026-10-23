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
    body: 'Pay per kWh for the energy you use, and get a receipt after every charge.',
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
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear }), -1, reverse));
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

function ScanVisual({ scrollX, width }: { scrollX: SharedValue<number>; width: number }) {
  const scan = useLoop(1300, { reverse: true });
  const bob = useLoop(2200, { reverse: true });
  const bob2 = useLoop(2600, { reverse: true, delay: 500 });
  const scanLine = useAnimatedStyle(() => ({ transform: [{ translateY: -46 + scan.value * 92 }] }));
  const bobA = useAnimatedStyle(() => ({ transform: [{ translateY: -6 + bob.value * 12 }] }));
  const bobB = useAnimatedStyle(() => ({ transform: [{ translateY: 5 - bob2.value * 10 }] }));
  return (
    <>
      <Layer scrollX={scrollX} index={1} width={width} depth={0.1} style={[StyleSheet.absoluteFill, styles.center]}>
        {[340, 260, 180].map((d) => (
          <View key={d} style={[styles.halo, { width: d, height: d, borderRadius: d / 2 }]} />
        ))}
      </Layer>

      <Layer scrollX={scrollX} index={1} width={width} depth={0.35} style={[StyleSheet.absoluteFill, styles.center]}>
        <View style={styles.phone}>
          <View style={styles.notch} />
          <View style={styles.phoneScreen}>
            <View style={styles.finder}>
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
              <MaterialCommunityIcons name="qrcode" size={82} color={Palette.ink} />
              <Animated.View style={[styles.scanLine, scanLine]} />
            </View>
            <Text style={styles.phoneHint}>Scan the charger QR</Text>
          </View>
        </View>
      </Layer>

      <Layer scrollX={scrollX} index={1} width={width} depth={0.7} style={styles.plugPos}>
        <Animated.View style={bobA}>
          <LinearGradient colors={Palette.gradVolt} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plugBadge}>
            <MaterialCommunityIcons name="ev-plug-type2" size={30} color={Palette.white} />
          </LinearGradient>
        </Animated.View>
      </Layer>
      <Layer scrollX={scrollX} index={1} width={width} depth={0.95} style={styles.boltPos}>
        <Animated.View style={[styles.boltBadge, bobB]}>
          <Ionicons name="flash" size={24} color={Palette.forest} />
        </Animated.View>
      </Layer>
    </>
  );
}

// ---------- slide 3: pay per kWh ----------

const ORBIT = 236;
const ORBIT_ICONS = ['contactless-payment', 'credit-card-outline', 'receipt-text-outline'] as const;

function OrbitBadge({ i, spin }: { i: number; spin: SharedValue<number> }) {
  const base = (i / ORBIT_ICONS.length) * 360;
  // counter-rotate so the icon stays upright while the ring turns
  const upright = useAnimatedStyle(() => ({ transform: [{ rotate: `${-(base + spin.value * 360)}deg` }] }));
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: `${base}deg` }] }]} pointerEvents="none">
      <View style={{ transform: [{ translateY: -ORBIT / 2 }] }}>
        <Animated.View style={[styles.orbitBadge, upright]}>
          <MaterialCommunityIcons name={ORBIT_ICONS[i]} size={22} color={Palette.forest} />
        </Animated.View>
      </View>
    </View>
  );
}

function PayVisual({ scrollX, width }: { scrollX: SharedValue<number>; width: number }) {
  const spin = useLoop(14000);
  const wobble = useLoop(2400, { reverse: true });
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateY: `${-16 + wobble.value * 32}deg` }, { translateY: -4 + wobble.value * 8 }],
  }));
  return (
    <>
      <Layer scrollX={scrollX} index={2} width={width} depth={0.25} style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View style={[styles.orbit, orbitStyle]}>
          {ORBIT_ICONS.map((_, i) => (
            <OrbitBadge key={i} i={i} spin={spin} />
          ))}
        </Animated.View>
      </Layer>
      <Layer scrollX={scrollX} index={2} width={width} depth={0.55} style={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View style={coinStyle}>
          <LinearGradient colors={Palette.gradForest} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.coin}>
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

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Next">
      <Animated.View style={[styles.nextWrap, morph]}>
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
          <Animated.Text numberOfLines={1} style={[styles.nextLabel, labelStyle]}>Get started</Animated.Text>
          <Ionicons name="arrow-forward" size={22} color={Palette.white} />
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
            <LinearGradient colors={Palette.gradHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.visual, { height: visualH }]}>
              {i === 0 ? <MapVisual scrollX={scrollX} width={width} /> : null}
              {i === 1 ? <ScanVisual scrollX={scrollX} width={width} /> : null}
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  skip: { fontFamily: Font.semibold, fontSize: 15, color: Palette.mist },

  visual: { borderRadius: Radius.hero, borderWidth: 1, borderColor: Palette.brandTint2, overflow: 'hidden' },
  title: { fontFamily: Font.display, fontSize: 32, lineHeight: 38, color: Palette.ink, marginTop: Spacing.xxl, letterSpacing: -0.4 },
  body: { fontFamily: Font.regular, fontSize: 16, lineHeight: 23, color: Palette.mist, marginTop: Spacing.md, maxWidth: 330 },

  // map pins
  pinAnchor: { position: 'absolute', width: 60, height: PIN_H, alignItems: 'center', justifyContent: 'center' },
  pinCol: { alignItems: 'center' },
  pin: { width: PIN, height: PIN, borderRadius: PIN / 2, backgroundColor: Palette.surface, borderWidth: 2.5, borderColor: Palette.volt, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },
  pinOff: { borderColor: Palette.mistLight },
  pinStem: { width: 3, height: 8, marginTop: -2, borderRadius: 2, backgroundColor: Palette.volt },
  pinStemOff: { backgroundColor: Palette.mistLight },
  pinPulse: { position: 'absolute', top: -6, width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.volt },

  // scan
  halo: { position: 'absolute', borderWidth: 1.5, borderColor: Palette.brandTint2, opacity: 0.7 },
  phone: {
    width: 156,
    height: 276,
    borderRadius: 32,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    padding: 9,
    transform: [{ rotate: '-5deg' }],
    ...Shadow.lift,
  },
  notch: { alignSelf: 'center', width: 44, height: 6, borderRadius: 3, backgroundColor: Palette.line, marginBottom: 8 },
  phoneScreen: { flex: 1, borderRadius: 24, backgroundColor: Palette.voltSofter, alignItems: 'center', justifyContent: 'center', gap: 14 },
  finder: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Palette.volt },
  cTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  cTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  scanLine: { position: 'absolute', width: 100, height: 3, borderRadius: 2, backgroundColor: Palette.volt, ...Shadow.volt },
  phoneHint: { fontFamily: Font.semibold, fontSize: 11, color: Palette.forest, textAlign: 'center', paddingHorizontal: 10 },
  plugPos: { position: 'absolute', top: '16%', right: '12%' },
  plugBadge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', ...Shadow.volt },
  boltPos: { position: 'absolute', bottom: '18%', left: '12%' },
  boltBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lift,
  },

  // pay
  orbit: { width: ORBIT, height: ORBIT, borderRadius: ORBIT / 2, borderWidth: 2, borderStyle: 'dashed', borderColor: Palette.brandTint2 },
  orbitBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.brandTint2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  coin: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', ...Shadow.volt },
  coinRing: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderRadius: 54, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  coinSymbol: { fontFamily: Font.display, fontSize: 60, lineHeight: 70, color: Palette.white },
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
  kwhText: { fontFamily: Font.bold, fontSize: 13, color: Palette.forest },

  // footer
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  nextWrap: { height: BTN, borderRadius: BTN / 2, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...Shadow.volt },
  ringBox: { alignItems: 'flex-end', justifyContent: 'center' },
  nextInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextLabel: { fontFamily: Font.bold, fontSize: 16, color: Palette.white },
});
