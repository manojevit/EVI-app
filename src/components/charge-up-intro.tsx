import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

import BrandLogo from '@/components/brand-logo';
import { Font, Palette } from '@/constants/theme';

/**
 * "Charge-up" launch animation.
 * The splash logo collapses into an energy cell → a ring charges 0→100% →
 * a bolt strikes with a particle burst and shockwave → the logo returns, powered.
 */

// Timeline (ms)
const SHRINK = 420;
const CHARGE_START = 420;
const CHARGE_MS = 1300;
const STRIKE = CHARGE_START + CHARGE_MS; // 1720
const LOGO_IN = 2150;
const TAGLINE_IN = 2450;
const EXIT = 3250;
const EXIT_MS = 380;

const RING = 232;
const STROKE = 10;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const GLOW = 440;
const SPLASH_LOGO_H = 142; // matches the native splash (imageWidth 200)

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  angle: (i / 24) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08),
  distance: i % 3 === 0 ? 215 : i % 3 === 1 ? 172 : 138,
  size: i % 3 === 0 ? 12 : i % 3 === 1 ? 9 : 6,
  color: i % 2 ? Palette.volt : Palette.gradEnergy[0],
}));

function haptic(kind: 'tick' | 'strike') {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'strike') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics unavailable — the animation still runs
  }
}

function Particle({ p, burst }: { p: (typeof PARTICLES)[number]; burst: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: burst.value > 0 ? 1 - burst.value * burst.value * burst.value : 0, // stay bright, fade at the end
    transform: [
      { translateX: Math.cos(p.angle) * p.distance * burst.value },
      { translateY: Math.sin(p.angle) * p.distance * burst.value },
      { scale: 1 - burst.value * 0.5 },
    ],
  }));
  return <Animated.View style={[styles.particle, { width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color }, style]} />;
}

export default function ChargeUpIntro({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const [pct, setPct] = useState(0);

  const logoA = useSharedValue(1); // splash logo
  const cell = useSharedValue(0); // energy cell dot
  const ring = useSharedValue(0); // ring visibility
  const progress = useSharedValue(0); // 0..1 charge
  const counter = useSharedValue(0); // counter visibility
  const bolt = useSharedValue(0);
  const burst = useSharedValue(0);
  const shock = useSharedValue(0);
  const glow = useSharedValue(0);
  const logoB = useSharedValue(0); // powered logo
  const tagline = useSharedValue(0);
  const stage = useSharedValue(1);
  const hint = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      logoA.value = withDelay(500, withTiming(0, { duration: 300 }));
      logoB.value = withDelay(500, withTiming(1, { duration: 300 }));
      tagline.value = withDelay(600, withTiming(1, { duration: 300 }));
      const t = setTimeout(onDone, 1400);
      return () => clearTimeout(t);
    }

    const easeIn = Easing.in(Easing.cubic);
    const easeOut = Easing.out(Easing.cubic);

    logoA.value = withTiming(0, { duration: SHRINK, easing: easeIn });
    cell.value = withSequence(
      withDelay(200, withTiming(1, { duration: 220, easing: easeOut })),
      withDelay(120, withTiming(0, { duration: 160 })),
    );
    counter.value = withSequence(
      withDelay(CHARGE_START + 40, withTiming(1, { duration: 200 })),
      withDelay(CHARGE_MS - 240, withTiming(0, { duration: 90 })),
    );
    progress.value = withDelay(CHARGE_START, withTiming(1, { duration: CHARGE_MS, easing: Easing.bezier(0.6, 0, 0.3, 1) }));
    glow.value = withSequence(
      withDelay(CHARGE_START, withTiming(0.55, { duration: CHARGE_MS })),
      withTiming(1, { duration: 90 }),
      withTiming(0.25, { duration: 600 }),
    );

    // strike
    bolt.value = withDelay(STRIKE, withSequence(withSpring(1, { damping: 8, stiffness: 220 }), withDelay(230, withTiming(0, { duration: 200 }))));
    burst.value = withDelay(STRIKE, withTiming(1, { duration: 720, easing: easeOut }));
    shock.value = withDelay(STRIKE, withTiming(1, { duration: 760, easing: easeOut }));
    ring.value = withSequence(
      withDelay(CHARGE_START, withTiming(1, { duration: 220 })),
      withDelay(STRIKE - CHARGE_START - 220 + 40, withTiming(0, { duration: 420 })),
    );

    // powered logo + tagline
    logoB.value = withDelay(LOGO_IN, withSpring(1, { damping: 12, stiffness: 140 }));
    tagline.value = withDelay(TAGLINE_IN, withTiming(1, { duration: 450, easing: easeOut }));
    hint.value = withDelay(700, withTiming(1, { duration: 400 }));

    // exit
    stage.value = withDelay(EXIT, withTiming(0, { duration: EXIT_MS, easing: easeIn }, (finished) => {
      if (finished) runOnJS(onDone)();
    }));

    const strikeTimer = setTimeout(() => haptic('strike'), STRIKE);
    return () => clearTimeout(strikeTimer);
    // shared values are stable; run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // counter text + light haptic ticks at 25 / 50 / 75 %
  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (v, prev) => {
      if (v === prev) return;
      runOnJS(setPct)(v);
      if (prev !== null && (v >= 25 && prev < 25 || v >= 50 && prev < 50 || v >= 75 && prev < 75)) runOnJS(haptic)('tick');
    },
  );

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - progress.value) }));

  const logoAStyle = useAnimatedStyle(() => ({ opacity: logoA.value, transform: [{ scale: 0.25 + logoA.value * 0.75 }] }));
  const cellStyle = useAnimatedStyle(() => ({ opacity: cell.value, transform: [{ scale: cell.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value,
    transform: [{ scale: 0.9 + ring.value * 0.1 + (progress.value >= 1 ? (1 - ring.value) * 0.45 : 0) }],
  }));
  const counterStyle = useAnimatedStyle(() => ({ opacity: counter.value, transform: [{ scale: 0.9 + counter.value * 0.1 }] }));
  const boltStyle = useAnimatedStyle(() => ({ opacity: bolt.value > 0.02 ? 1 : 0, transform: [{ scale: bolt.value }, { rotate: `${(1 - bolt.value) * -18}deg` }] }));
  const shockStyle = useAnimatedStyle(() => ({ opacity: shock.value > 0 ? 0.55 * (1 - shock.value) : 0, transform: [{ scale: 0.6 + shock.value * 2.2 }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.7 + glow.value * 0.45 }] }));
  const logoBStyle = useAnimatedStyle(() => ({ opacity: logoB.value, transform: [{ scale: 0.7 + logoB.value * 0.3 }] }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: tagline.value, transform: [{ translateY: (1 - tagline.value) * 12 }] }));
  const stageStyle = useAnimatedStyle(() => ({ opacity: stage.value, transform: [{ scale: 1 + (1 - stage.value) * 0.06 }] }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hint.value * 0.7 * stage.value }));

  return (
    <Pressable style={styles.fill} onPress={onDone} accessibilityRole="button" accessibilityLabel="Skip intro">
      <Animated.View style={[styles.fill, styles.center, stageStyle]}>
        {/* energy field */}
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Svg width={GLOW} height={GLOW}>
            <Defs>
              <RadialGradient id="introGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={Palette.volt} stopOpacity={0.55} />
                <Stop offset="0.45" stopColor={Palette.volt} stopOpacity={0.22} />
                <Stop offset="1" stopColor={Palette.volt} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#introGlow)" />
          </Svg>
        </Animated.View>

        {/* shockwave */}
        <Animated.View style={[styles.shock, shockStyle]} />

        {/* charging ring */}
        <Animated.View style={[styles.abs, ringStyle]}>
          <Svg width={RING} height={RING}>
            <Defs>
              <LinearGradient id="introRing" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Palette.gradEnergy[0]} />
                <Stop offset="1" stopColor={Palette.volt} />
              </LinearGradient>
            </Defs>
            <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={Palette.voltSoft} strokeWidth={STROKE} fill="none" />
            <AnimatedCircle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke="url(#introRing)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              animatedProps={ringProps}
              fill="none"
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
        </Animated.View>

        {/* counter */}
        <Animated.View style={[styles.abs, styles.counterWrap, counterStyle]}>
          <Text style={styles.counter}>
            {pct}
            <Text style={styles.counterPct}>%</Text>
          </Text>
          <Text style={styles.counterLabel}>Charging up</Text>
        </Animated.View>

        {/* energy cell */}
        <Animated.View style={[styles.abs, styles.cell, cellStyle]} />

        {/* particles */}
        {PARTICLES.map((p, i) => (
          <Particle key={i} p={p} burst={burst} />
        ))}

        {/* bolt */}
        <Animated.View style={[styles.abs, styles.boltWrap, boltStyle]}>
          <Ionicons name="flash" size={92} color={Palette.volt} />
        </Animated.View>

        {/* splash logo (matches native splash, then collapses) */}
        <Animated.View style={[styles.abs, logoAStyle]}>
          <BrandLogo height={SPLASH_LOGO_H} />
        </Animated.View>

        {/* powered logo + tagline */}
        <View style={[styles.abs, styles.final]}>
          <Animated.View style={logoBStyle}>
            <BrandLogo height={124} />
          </Animated.View>
          <Animated.Text style={[styles.tagline, taglineStyle]}>Charge smarter, drive further.</Animated.Text>
        </View>
      </Animated.View>

      <Animated.Text style={[styles.hint, hintStyle]}>Tap to skip</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Palette.canvas },
  center: { alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  glow: { position: 'absolute', width: GLOW, height: GLOW },
  shock: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 3, borderColor: Palette.volt },
  cell: { width: 16, height: 16, borderRadius: 8, backgroundColor: Palette.volt },
  particle: { position: 'absolute' },
  boltWrap: { width: 120, height: 120 },

  counterWrap: { width: RING, height: RING },
  counter: { fontFamily: Font.display, fontSize: 52, color: Palette.ink, fontVariant: ['tabular-nums'] },
  counterPct: { fontFamily: Font.displaySemi, fontSize: 24, color: Palette.mist },
  counterLabel: { fontFamily: Font.medium, fontSize: 13, color: Palette.mist, marginTop: 2, letterSpacing: 0.3 },

  final: { alignItems: 'center' },
  tagline: { fontFamily: Font.medium, fontSize: 16, color: Palette.inkSoft, marginTop: 18, letterSpacing: 0.2 },

  hint: { position: 'absolute', bottom: 48, alignSelf: 'center', fontFamily: Font.medium, fontSize: 13, color: Palette.mist },
});
