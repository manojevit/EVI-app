import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import BrandLogo from '@/components/brand-logo';
import { Font, Palette, Radius, Shadow, Spacing } from '@/constants/theme';
import { ACCOUNT, PLANS, STATIONS, distanceKm, formatINR, freeConnectorCount, maxPowerKw, stationConnectors } from '@/data/mock';
import { vehiclePhoto } from '@/data/vehicle-images';

const SLIDES = [
  {
    title: 'Find a charger\nin seconds',
    body: 'See live availability, charging speed and price at EVIT stations near you.',
  },
  {
    title: 'Scan, plug in,\ncharge',
    body: 'Scan the QR on any EVIT charger to start, then follow your charge live.',
  },
  {
    title: 'Pay as\nyou charge',
    body: 'Top up your wallet once, pay per kWh, and get a receipt for every session.',
  },
];
const LAST = SLIDES.length - 1;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const BTN = 64;
const BTN_R = 25; // progress ring sits inside the button
const BTN_C = 2 * Math.PI * BTN_R;

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

// ---------- slide visuals ----------

function MapVisual({ scrollX, width }: { scrollX: SharedValue<number>; width: number }) {
  const hub = STATIONS.find((s) => s.id === 'demo-hub-north') ?? STATIONS[0];
  const pins = [
    { left: '18%', top: '22%' },
    { left: '62%', top: '14%' },
    { left: '40%', top: '42%' },
    { left: '76%', top: '40%' },
    { left: '24%', top: '58%' },
  ] as const;
  return (
    <>
      <Layer scrollX={scrollX} index={0} width={width} depth={0.25} style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 340 300" preserveAspectRatio="xMidYMid slice">
          <Path d="M-10 70 C 80 40, 160 120, 350 80" stroke="#FFFFFF" strokeWidth={14} fill="none" opacity={0.9} />
          <Path d="M40 -10 C 90 90, 60 190, 120 320" stroke="#FFFFFF" strokeWidth={10} fill="none" opacity={0.8} />
          <Path d="M-10 210 C 110 170, 220 250, 350 190" stroke="#FFFFFF" strokeWidth={12} fill="none" opacity={0.85} />
          <Path d="M250 -10 C 230 100, 290 180, 260 320" stroke="#FFFFFF" strokeWidth={8} fill="none" opacity={0.7} />
        </Svg>
      </Layer>
      {pins.map((p, i) => (
        <Layer key={i} scrollX={scrollX} index={0} width={width} depth={0.45 + i * 0.06} style={[styles.pinPos, { left: p.left, top: p.top }]}>
          <View style={[styles.pin, i === 2 && styles.pinActive]}>
            <MaterialCommunityIcons name="ev-station" size={i === 2 ? 20 : 16} color={i === 2 ? Palette.white : Palette.forest} />
          </View>
          <View style={[styles.pinStem, i === 2 && { backgroundColor: Palette.volt }]} />
        </Layer>
      ))}
      <Layer scrollX={scrollX} index={0} width={width} depth={0.9} style={styles.bottomCard}>
        <View style={[styles.card, styles.hubCard]}>
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons name="ev-station" size={22} color={Palette.forest} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{hub.name}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {maxPowerKw(hub)} kW · <Text style={styles.free}>{freeConnectorCount(hub)} of {stationConnectors(hub).length} free</Text> ·{' '}
              {distanceKm(hub).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.go}>
            <Ionicons name="navigate" size={16} color={Palette.white} />
          </View>
        </View>
      </Layer>
      <Layer scrollX={scrollX} index={0} width={width} depth={1.1} style={styles.topChip}>
        <View style={styles.chip}>
          <View style={styles.liveDot} />
          <Text style={styles.chipText}>{STATIONS.length} stations near you</Text>
        </View>
      </Layer>
    </>
  );
}

function ChargeVisual({ scrollX, width }: { scrollX: SharedValue<number>; width: number }) {
  return (
    <>
      <Layer scrollX={scrollX} index={1} width={width} depth={1.0} style={styles.topChip}>
        <View style={styles.chip}>
          <MaterialCommunityIcons name="qrcode-scan" size={14} color={Palette.forest} />
          <Text style={styles.chipText}>Scan the QR on the charger</Text>
        </View>
      </Layer>
      <Layer scrollX={scrollX} index={1} width={width} depth={0.35} style={styles.carWrap}>
        <Image source={vehiclePhoto('BYD Seal')} style={styles.car} contentFit="contain" />
      </Layer>
      <Layer scrollX={scrollX} index={1} width={width} depth={0.85} style={styles.bottomCard}>
        <View style={[styles.card, styles.chargeCard]}>
          <View style={styles.chargeTop}>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Charging · 3.4 kW</Text>
            </View>
            <Text style={styles.pct}>62%</Text>
          </View>
          <View style={styles.track}>
            <LinearGradient colors={Palette.gradEnergy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: '62%' }]} />
          </View>
          <Text style={styles.eta}>80% in about 45 min</Text>
        </View>
      </Layer>
    </>
  );
}

function WalletVisual({ scrollX, width }: { scrollX: SharedValue<number>; width: number }) {
  const receipts = [
    { when: '22 Oct, 15:07', kwh: '2.37 kWh', cost: 23.7 },
    { when: '22 Oct, 12:27', kwh: '1.77 kWh', cost: 17.7 },
  ];
  const plus = PLANS.find((p) => p.id === 'plus') ?? PLANS[0];
  return (
    <>
      <Layer scrollX={scrollX} index={2} width={width} depth={0.3} style={styles.walletPos}>
        <View style={[styles.card, styles.walletCard]}>
          <View style={styles.walletTop}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={16} color={Palette.forest} />
            </View>
            <Text style={styles.walletLabel}>Wallet balance</Text>
          </View>
          <Text style={styles.walletAmount}>{formatINR(ACCOUNT.walletBalance)}</Text>
          <View style={styles.addMoney}>
            <Ionicons name="add" size={16} color={Palette.white} />
            <Text style={styles.addMoneyText}>Add money</Text>
          </View>
        </View>
      </Layer>
      {receipts.map((r, i) => (
        <Layer key={r.when} scrollX={scrollX} index={2} width={width} depth={0.7 + i * 0.25} style={[styles.receiptPos, { top: 168 + i * 66 }]}>
          <View style={[styles.card, styles.receipt]}>
            <View style={styles.receiptIcon}>
              <Ionicons name="flash" size={16} color={Palette.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.receiptTitle}>EVI-Test-1</Text>
              <Text style={styles.receiptMeta}>{r.when} · {r.kwh}</Text>
            </View>
            <Text style={styles.receiptCost}>{formatINR(r.cost)}</Text>
          </View>
        </Layer>
      ))}
      <Layer scrollX={scrollX} index={2} width={width} depth={1.05} style={styles.bottomCard}>
        <LinearGradient colors={Palette.gradEnergy} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plus}>
          <View style={styles.plusIcon}>
            <MaterialCommunityIcons name="star-four-points" size={18} color={Palette.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.plusTitle}>{plus.name}</Text>
            <Text style={styles.plusMeta}>{plus.kwh} kWh a month for ₹{plus.priceINR}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Palette.white} />
        </LinearGradient>
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
  const goNext = () => next();

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
              {i === 1 ? <ChargeVisual scrollX={scrollX} width={width} /> : null}
              {i === 2 ? <WalletVisual scrollX={scrollX} width={width} /> : null}
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
        <NextButton scrollX={scrollX} width={width} onPress={goNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.canvas },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  skip: { fontFamily: Font.semibold, fontSize: 15, color: Palette.mist },

  visual: { borderRadius: Radius.hero, borderWidth: 1, borderColor: Palette.brandTint2, overflow: 'hidden' },
  title: { fontFamily: Font.display, fontSize: 32, lineHeight: 38, color: Palette.ink, marginTop: Spacing.xxl, letterSpacing: -0.4 },
  body: { fontFamily: Font.regular, fontSize: 16, lineHeight: 23, color: Palette.mist, marginTop: Spacing.md, maxWidth: 320 },

  // shared visual bits
  card: { backgroundColor: Palette.surface, borderRadius: 18, padding: Spacing.md, ...Shadow.lift },
  topChip: { position: 'absolute', top: 16, left: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.surface, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7, ...Shadow.soft },
  chipText: { fontFamily: Font.semibold, fontSize: 12, color: Palette.forest },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.volt },
  bottomCard: { position: 'absolute', left: 16, right: 16, bottom: 16 },

  // map
  pinPos: { position: 'absolute', alignItems: 'center' },
  pin: { width: 34, height: 34, borderRadius: 17, backgroundColor: Palette.surface, borderWidth: 2.5, borderColor: Palette.volt, alignItems: 'center', justifyContent: 'center', ...Shadow.soft },
  pinActive: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.volt, borderColor: Palette.white },
  pinStem: { width: 3, height: 8, marginTop: -2, borderRadius: 2, backgroundColor: Palette.brandTint2 },
  hubCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: Font.displaySemi, fontSize: 14, color: Palette.ink },
  cardMeta: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist, marginTop: 2 },
  free: { color: Palette.forest, fontFamily: Font.semibold },
  go: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center' },

  // charge
  carWrap: { position: 'absolute', left: 0, right: 0, top: 64, alignItems: 'center' },
  car: { width: '94%', height: 210 },
  chargeCard: { gap: 8, padding: Spacing.lg },
  chargeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.forest },
  pct: { fontFamily: Font.display, fontSize: 18, color: Palette.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: Palette.voltSoft, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  eta: { fontFamily: Font.medium, fontSize: 12, color: Palette.mist },

  // wallet
  walletPos: { position: 'absolute', top: 18, left: 16, right: 16 },
  walletCard: { padding: Spacing.lg, gap: 6 },
  walletTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  walletIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  walletLabel: { fontFamily: Font.semibold, fontSize: 13, color: Palette.inkSoft },
  walletAmount: { fontFamily: Font.display, fontSize: 28, color: Palette.ink },
  addMoney: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: Palette.volt, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  addMoneyText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
  receiptPos: { position: 'absolute', left: 30, right: 16 },
  receipt: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
  receiptIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.voltSoft, alignItems: 'center', justifyContent: 'center' },
  receiptTitle: { fontFamily: Font.semibold, fontSize: 13, color: Palette.ink },
  receiptMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.mist },
  receiptCost: { fontFamily: Font.display, fontSize: 15, color: Palette.forest },
  plus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: 18, padding: Spacing.md, ...Shadow.volt },
  plusIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.white, alignItems: 'center', justifyContent: 'center' },
  plusTitle: { fontFamily: Font.displaySemi, fontSize: 15, color: Palette.white },
  plusMeta: { fontFamily: Font.medium, fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 1 },

  // footer
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, backgroundColor: Palette.volt },
  nextWrap: { height: BTN, borderRadius: BTN / 2, backgroundColor: Palette.forest, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...Shadow.volt },
  ringBox: { alignItems: 'flex-end', justifyContent: 'center' },
  nextInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextLabel: { fontFamily: Font.bold, fontSize: 16, color: Palette.white },
});
