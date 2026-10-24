import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import BrandLogo, { BrandLogoFull } from '@/components/brand-logo';
import { Font, Palette } from '@/constants/theme';

/**
 * "Charge-up" launch animation — one continuous sequence, all on the UI thread.
 *
 * 1. The splash logo inhales, then collapses into an energy dot.
 * 2. The dot rises onto the ring and becomes a comet that draws the charge arc;
 *    an odometer counter rolls 0 → 100.
 * 3. Wind-up: the ring compresses (anticipation), then a bolt strikes — sparks,
 *    double shockwave and a short screen shake (no vibration).
 * 4. A light wash floods out from the bolt, the bolt deepens to the logo's green and
 *    hands over to the official green EVIT logo (same as the app icon); the tagline staggers in.
 * 5. The green contracts back into the centre, revealing onboarding.
 */

// Timeline (ms)
const T = {
  inhale: 120,
  collapse: 380, // splash logo gone
  lift: 380, // dot rises to the ring
  charge: 560, // arc starts drawing
  chargeMs: 1100,
  wind: 1660, // anticipation
  strike: 1820,
  flood: 1880,
  boltOut: 2200, // bolt flies into the logo's own bolt
  logoIn: 2360,
  tagline: 2500,
  exit: 3250,
};

const RING = 232;
const GROUP = RING + 72; // ring + gauge ticks
const STROKE = 10;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const GLOW = 460;
// Matches the native splash: full logo at imageWidth 160 (the widest that stays inside
// Android 12+'s round splash-icon mask, so the E and "Technologies" aren't clipped).
const SPLASH_LOGO_H = (160 * 803) / 1200;
const DIGIT_H = 62;
const DIGIT_W = 37;
const BOLT_W = 96;
const BOLT_H = 140;
const BOLT_PATH = 'M56 2 H80 L60 56 H92 L36 138 L48 80 H14 Z';
const TAGLINE = ['Charge', 'smarter,', 'drive', 'further.'];
// Where the bolt inside the final EVIT logo sits, relative to screen centre
// (logo 124pt tall, lifted ~21pt by the tagline below it), and its size vs. ours.
const LOGO_BOLT = { x: 21, y: -41, scale: 0.54 };

const SPRING_POP = { damping: 9, stiffness: 260, mass: 0.9 };
const SPRING_SOFT = { damping: 16, stiffness: 170 };
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const easeIn = Easing.in(Easing.cubic);
const easeOut = Easing.out(Easing.cubic);
const easeOutExpo = Easing.out(Easing.exp);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Deterministic "random" so every launch looks the same.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const SPARKS = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (rand(i, 1) - 0.5) * 0.3;
  return {
    angle,
    distance: 130 + rand(i, 2) * 120,
    length: 10 + rand(i, 3) * 18,
    thick: rand(i, 4) > 0.6 ? 4 : 3,
    color: rand(i, 5) > 0.45 ? Palette.volt : Palette.gradEnergy[0],
    delay: rand(i, 6) * 0.12,
  };
});

// Energy streaming into the ring while it charges.
const INTAKE = Array.from({ length: 22 }, (_, i) => ({
  angle: (i / 22) * Math.PI * 2 + (rand(i, 7) - 0.5) * 0.25,
  offset: rand(i, 8),
  from: 210 + rand(i, 9) * 90,
  length: 8 + rand(i, 10) * 14,
}));
// Gauge ticks around the ring that light up as the charge passes them.
const TICKS = 48;
const TICK_R = R + 20;
const LIME = '#B6F09C';

// ---------- pieces ----------

function Spark({ s, burst }: { s: (typeof SPARKS)[number]; burst: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(burst.value, [s.delay, 1], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: burst.value > 0 && t < 1 ? 1 - t * t : 0,
      transform: [
        { translateX: Math.cos(s.angle) * s.distance * t },
        { translateY: Math.sin(s.angle) * s.distance * t },
        { rotate: `${s.angle}rad` },
        { scaleX: 1.4 - t * 1.1 }, // streak stretches out, then shrinks as it slows
      ],
    };
  });
  return (
    <Animated.View
      style={[styles.abs, { width: s.length, height: s.thick, borderRadius: s.thick, backgroundColor: s.color }, style]}
    />
  );
}

function IntakeStreak({
  p,
  clock,
  intake,
}: {
  p: (typeof INTAKE)[number];
  clock: SharedValue<number>;
  intake: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const phase = (clock.value + p.offset) % 1;
    const eased = phase * phase; // accelerates as it gets pulled in
    const r = p.from + (R + 8 - p.from) * eased;
    return {
      opacity: intake.value * Math.sin(phase * Math.PI) * 0.9,
      transform: [
        { translateX: Math.cos(p.angle) * r },
        { translateY: Math.sin(p.angle) * r },
        { rotate: `${p.angle}rad` },
        { scaleX: 0.5 + eased * 1.1 },
      ],
    };
  });
  return <Animated.View style={[styles.abs, styles.intake, { width: p.length }, style]} />;
}

/** A gauge tick: a dim static bar with a green bar on top that fades in (opacity only). */
function Tick({ i, progress }: { i: number; progress: SharedValue<number> }) {
  const at = i / TICKS;
  const major = i % 4 === 0;
  const lit = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [at - 0.001, at + 0.035], [0, 1], Extrapolation.CLAMP),
  }));
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { transform: [{ rotate: `${at * 360}deg` }] }]} pointerEvents="none">
      <View style={{ transform: [{ translateY: -TICK_R }] }}>
        <View style={[styles.tickBar, major && styles.tickMajor, styles.tickDim]} />
        <Animated.View style={[styles.tickBar, styles.tickLit, major && styles.tickMajorLit, lit]} />
      </View>
    </View>
  );
}

function Shockwave({ shock, size, width }: { shock: SharedValue<number>; size: number; width: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: shock.value > 0 && shock.value < 1 ? 0.6 * (1 - shock.value) : 0,
    transform: [{ scale: 0.35 + shock.value * 2.9 }],
  }));
  return (
    <Animated.View
      style={[styles.abs, { width: size, height: size, borderRadius: size / 2, borderWidth: width, borderColor: Palette.volt }, style]}
    />
  );
}

const clamp01 = (x: number) => {
  'worklet';
  return Math.min(Math.max(x, 0), 1);
};

/**
 * One digit of the counter: a strip of digits moved by transform only (no layout,
 * no React renders), snapping to whole numbers so it reads crisp at any speed.
 */
function DigitColumn({ progress, place }: { progress: SharedValue<number>; place: 'hundreds' | 'tens' | 'units' }) {
  const digits = place === 'hundreds' ? ['1'] : ROLL;
  const roll = useAnimatedStyle(() => {
    const v = Math.round(progress.value * 100);
    const index = place === 'hundreds' ? 0 : place === 'tens' ? Math.floor(v / 10) : v % 10;
    const shown = place === 'hundreds' ? v >= 100 : place === 'tens' ? v >= 10 : true;
    return { opacity: shown ? 1 : 0, transform: [{ translateY: -index * DIGIT_H }] };
  });
  return (
    <View style={styles.digitBox}>
      <Animated.View style={roll}>
        {digits.map((d, i) => (
          <Text key={i} style={styles.digit}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const ROLL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

function Odometer({ progress }: { progress: SharedValue<number> }) {
  // Hidden leading columns sit on the left; slide the row so the number stays centred.
  const row = useAnimatedStyle(() => {
    const v = Math.round(progress.value * 100);
    const hidden = (v < 100 ? 1 : 0) + (v < 10 ? 1 : 0);
    return { transform: [{ translateX: (-hidden * DIGIT_W) / 2 }] };
  });
  return (
    <Animated.View style={[styles.odometer, row]}>
      <DigitColumn progress={progress} place="hundreds" />
      <DigitColumn progress={progress} place="tens" />
      <DigitColumn progress={progress} place="units" />
      <Text style={styles.pct}>%</Text>
    </Animated.View>
  );
}

function TaglineWord({ word, i, tagline }: { word: string; i: number; tagline: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(tagline.value, [i * 0.14, i * 0.14 + 0.58], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ translateY: (1 - t) * 16 }] };
  });
  return <Animated.Text style={[styles.taglineWord, style]}>{word}</Animated.Text>;
}

// ---------- intro ----------

export default function ChargeUpIntro({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const floodD = Math.hypot(width, height) * 1.05;

  const logoA = useSharedValue(0); // splash logo: 0 = resting, 1 = gone
  const dot = useSharedValue(0); // energy dot scale
  const lift = useSharedValue(0); // dot travels centre → ring top
  const track = useSharedValue(0); // ring track visibility
  const progress = useSharedValue(0); // 0..1 charge
  const counter = useSharedValue(0);
  const wind = useSharedValue(0); // anticipation squeeze
  const blast = useSharedValue(0); // charge group blows outward
  const bolt = useSharedValue(0);
  const boltWhite = useSharedValue(0);
  const boltOut = useSharedValue(0);
  const burst = useSharedValue(0);
  const shockA = useSharedValue(0);
  const shockB = useSharedValue(0);
  const shake = useSharedValue(0);
  const glow = useSharedValue(0);
  const flood = useSharedValue(0);
  const floodLead = useSharedValue(0); // lighter wave running just ahead of the flood
  const sheen = useSharedValue(0);
  const clock = useSharedValue(0); // looping 0..1 for the intake stream
  const intake = useSharedValue(0);
  const split = useSharedValue(0); // RGB-split glitch on the bolt
  const flicker = useSharedValue(0); // neon power-on of the logo
  const logoB = useSharedValue(0);
  const tagline = useSharedValue(0);
  const exit = useSharedValue(0);
  const hint = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      logoA.value = withDelay(400, withTiming(1, { duration: 300 }));
      flood.value = withDelay(400, withTiming(1, { duration: 300 }));
      logoB.value = withDelay(500, withTiming(1, { duration: 300 }));
      flicker.value = withDelay(500, withTiming(1, { duration: 300 }));
      tagline.value = withDelay(600, withTiming(1, { duration: 300 }));
      const t = setTimeout(onDone, 1600);
      return () => clearTimeout(t);
    }

    // 1. inhale + collapse
    logoA.value = withSequence(
      withTiming(-0.06, { duration: T.inhale, easing: easeOut }),
      withTiming(1, { duration: T.collapse - T.inhale, easing: easeIn }),
    );
    dot.value = withDelay(T.collapse - 140, withSpring(1, SPRING_POP));

    // 2. dot rises onto the ring, arc charges
    lift.value = withDelay(T.lift, withTiming(1, { duration: 220, easing: inOut }));
    track.value = withDelay(T.lift, withTiming(1, { duration: 260, easing: easeOut }));
    counter.value = withDelay(T.charge, withSpring(1, SPRING_SOFT));
    // finite clock (one stream cycle ≈ 760ms) so the streaks stop computing once charging ends
    clock.value = withDelay(T.charge, withTiming((T.wind - T.charge) / 760, { duration: T.wind - T.charge, easing: Easing.linear }));
    intake.value = withSequence(
      withDelay(T.charge, withTiming(1, { duration: 300 })),
      withDelay(T.wind - T.charge - 300 - 120, withTiming(0, { duration: 200 })),
    );
    progress.value = withDelay(T.charge, withTiming(1, { duration: T.chargeMs, easing: Easing.bezier(0.55, 0, 0.25, 1) }));
    glow.value = withSequence(
      withDelay(T.lift, withTiming(0.55, { duration: T.wind - T.lift, easing: Easing.in(Easing.quad) })),
      withTiming(0.9, { duration: T.strike - T.wind, easing: easeIn }),
      withTiming(0.35, { duration: 500, easing: easeOut }),
    );

    // 3. wind-up → strike
    wind.value = withDelay(T.wind, withTiming(1, { duration: T.strike - T.wind, easing: easeIn }));
    blast.value = withDelay(T.strike, withTiming(1, { duration: 420, easing: easeOutExpo }));
    bolt.value = withDelay(T.strike, withSpring(1, SPRING_POP));
    split.value = withDelay(
      T.strike,
      withSequence(withTiming(1, { duration: 70, easing: easeOut }), withTiming(0, { duration: 380, easing: easeOut })),
    );
    burst.value = withDelay(T.strike, withTiming(1, { duration: 760, easing: easeOutExpo }));
    shockA.value = withDelay(T.strike, withTiming(1, { duration: 700, easing: easeOut }));
    shockB.value = withDelay(T.strike + 90, withTiming(1, { duration: 760, easing: easeOut }));
    // 0 → 1 drives a damped sine (see stageStyle) — a smooth decaying shake, no hard reversals
    shake.value = withDelay(T.strike, withTiming(1, { duration: 420, easing: Easing.linear }));

    // 4. green flood, bolt hands over to the white logo
    floodLead.value = withDelay(T.flood - 40, withTiming(1, { duration: 520, easing: inOut }));
    flood.value = withDelay(T.flood + 50, withTiming(1, { duration: 520, easing: inOut }));
    flicker.value = withDelay(
      T.logoIn,
      // eased "power-on" pulse: up, a soft dip, settle — reads like neon without hard blinks
      withSequence(
        withTiming(1, { duration: 140, easing: easeOut }),
        withTiming(0.55, { duration: 110, easing: inOut }),
        withTiming(1, { duration: 200, easing: easeOut }),
      ),
    );
    boltWhite.value = withDelay(T.flood + 120, withTiming(1, { duration: 200 }));
    boltOut.value = withDelay(T.boltOut, withTiming(1, { duration: 340, easing: inOut }));
    logoB.value = withDelay(T.logoIn, withSpring(1, SPRING_SOFT));
    sheen.value = withDelay(T.logoIn + 120, withTiming(1, { duration: 900, easing: inOut }));
    tagline.value = withDelay(T.tagline, withTiming(1, { duration: 620, easing: easeOut }));
    hint.value = withSequence(withDelay(700, withTiming(1, { duration: 400 })), withDelay(T.strike - 1100, withTiming(0, { duration: 150 })));

    // 5. contract and hand off
    exit.value = withDelay(
      T.exit,
      withTiming(1, { duration: 420, easing: inOut }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    return () => cancelAnimation(clock);
    // shared values are stable; run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // ---- styles ----
  const stageStyle = useAnimatedStyle(() => {
    const t = shake.value;
    const amp = t > 0 && t < 1 ? 7 * (1 - t) * (1 - t) : 0;
    return {
      transform: [{ translateX: Math.sin(t * Math.PI * 6) * amp }, { translateY: Math.cos(t * Math.PI * 5) * amp * 0.4 }],
    };
  });

  const logoAStyle = useAnimatedStyle(() => ({
    opacity: interpolate(logoA.value, [0, 0.75, 1], [1, 0.6, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(logoA.value, [-0.06, 0, 1], [1.04, 1, 0.08]) }],
  }));

  // the whole charging group: squeezes on wind-up, blows outward on strike
  const chargeGroup = useAnimatedStyle(() => ({
    opacity: 1 - blast.value,
    transform: [{ scale: 1 - wind.value * 0.2 + blast.value * 0.75 }],
  }));
  const trackStyle = useAnimatedStyle(() => ({
    opacity: track.value,
    transform: [{ scale: 0.86 + track.value * 0.14 }],
  }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - progress.value) }));
  const ticksStyle = useAnimatedStyle(() => ({ opacity: track.value }));
  const ringGlowProps =useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - progress.value) }));
  const labelCharging = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0.97, 1], [1, 0], Extrapolation.CLAMP) }));
  const labelFull = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [0.97, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ translateY: (1 - t) * 6 }] };
  });
  const ghostLime = useAnimatedStyle(() => ({ opacity: split.value * 0.85, transform: [{ translateX: -9 * split.value }, { translateY: 3 * split.value }] }));
  const ghostDeep = useAnimatedStyle(() => ({ opacity: split.value * 0.75, transform: [{ translateX: 9 * split.value }, { translateY: -3 * split.value }] }));
  const floodLeadStyle = useAnimatedStyle(() => {
    // leads on the way out, lags on the way back in — a two-tone wave edge both times
    const s = floodLead.value * (1 - Math.pow(exit.value, 1.6));
    return { opacity: s > 0.001 ? 1 : 0, transform: [{ scale: s }] };
  });
  const cometSpin = useAnimatedStyle(() => ({ transform: [{ rotate: `${progress.value * 360}deg` }] }));
  const cometDot = useAnimatedStyle(() => ({
    opacity: dot.value > 0.01 ? 1 : 0,
    transform: [{ translateY: -R * lift.value }, { scale: dot.value * (1 - lift.value * 0.25) }],
  }));
  const counterStyle = useAnimatedStyle(() => ({
    opacity: counter.value * (1 - wind.value),
    transform: [{ scale: 0.88 + counter.value * 0.12 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * (1 - flood.value * 0.7) * (1 - exit.value),
    transform: [{ scale: 0.6 + glow.value * 0.55 }],
  }));

  const boltStyle = useAnimatedStyle(() => ({
    opacity: bolt.value > 0.01 ? interpolate(boltOut.value, [0.6, 1], [1, 0], Extrapolation.CLAMP) : 0,
    transform: [
      { translateX: LOGO_BOLT.x * boltOut.value },
      { translateY: LOGO_BOLT.y * boltOut.value },
      { scale: bolt.value * (1 - boltOut.value * (1 - LOGO_BOLT.scale)) },
      { rotate: `${(1 - bolt.value) * -16}deg` },
    ],
  }));
  const boltWhiteStyle = useAnimatedStyle(() => ({ opacity: boltWhite.value }));

  const floodStyle = useAnimatedStyle(() => {
    const s = flood.value * (1 - exit.value);
    return { opacity: s > 0.001 ? 1 : 0, transform: [{ scale: s }] };
  });
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: sheen.value > 0 && sheen.value < 1 ? 1 : 0,
    transform: [{ translateX: interpolate(sheen.value, [0, 1], [-width, width]) }, { rotate: '18deg' }],
  }));

  const finalStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ translateY: -exit.value * 18 }, { scale: 1 - exit.value * 0.12 }],
  }));
  const logoBStyle = useAnimatedStyle(() => ({
    opacity: flicker.value,
    transform: [{ scale: 0.94 + logoB.value * 0.06 }], // small, so the logo's bolt lands where ours went
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hint.value * 0.7 }));

  return (
    <Pressable style={styles.fill} onPress={onDone} accessibilityRole="button" accessibilityLabel="Skip intro">
      <Animated.View style={[styles.fill, styles.center, stageStyle]}>
        {/* energy field */}
        <Animated.View
          style={[styles.abs, { width: GLOW, height: GLOW }, glowStyle]}
          pointerEvents="none"
          renderToHardwareTextureAndroid
          shouldRasterizeIOS>
          <Svg width={GLOW} height={GLOW}>
            <Defs>
              <RadialGradient id="introGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={Palette.volt} stopOpacity={0.55} />
                <Stop offset="0.45" stopColor={Palette.volt} stopOpacity={0.2} />
                <Stop offset="1" stopColor={Palette.volt} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#introGlow)" />
          </Svg>
        </Animated.View>

        {/* splash logo (matches the native splash, then collapses) */}
        <Animated.View style={[styles.abs, logoAStyle]}>
          <BrandLogoFull height={SPLASH_LOGO_H} />
        </Animated.View>

        {/* energy streaming in */}
        {INTAKE.map((p, i) => (
          <IntakeStreak key={i} p={p} clock={clock} intake={intake} />
        ))}

        {/* charging group */}
        <Animated.View style={[styles.abs, { width: GROUP, height: GROUP }, chargeGroup]}>
          <Animated.View style={[StyleSheet.absoluteFill, ticksStyle]} pointerEvents="none">
            {Array.from({ length: TICKS }, (_, i) => (
              <Tick key={i} i={i} progress={progress} />
            ))}
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, trackStyle]}>
            <Svg width={RING} height={RING}>
              <Defs>
                <SvgGradient id="introRing" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={Palette.gradEnergy[0]} />
                  <Stop offset="1" stopColor={Palette.volt} />
                </SvgGradient>
              </Defs>
              <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={Palette.voltSoft} strokeWidth={STROKE} fill="none" />
              {/* soft glow under the arc */}
              <AnimatedCircle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                stroke={Palette.volt}
                strokeOpacity={0.16}
                strokeWidth={STROKE + 14}
                strokeLinecap="round"
                strokeDasharray={`${CIRC} ${CIRC}`}
                animatedProps={ringGlowProps}
                fill="none"
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
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

          {/* comet: the energy dot riding the tip of the arc */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, cometSpin]} pointerEvents="none">
            <Animated.View style={[styles.comet, cometDot]}>
              <View style={styles.cometHalo} />
              <View style={styles.cometCore} />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[StyleSheet.absoluteFill, styles.center, counterStyle]}>
            <Odometer progress={progress} />
            <View style={styles.labelBox}>
              <Animated.Text style={[styles.counterLabel, labelCharging]}>Charging up</Animated.Text>
              <Animated.Text style={[styles.counterLabel, styles.labelFull, labelFull]}>Fully charged</Animated.Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* shockwaves + sparks */}
        <Shockwave shock={shockA} size={RING} width={4} />
        <Shockwave shock={shockB} size={RING * 0.8} width={2} />
        {SPARKS.map((s, i) => (
          <Spark key={i} s={s} burst={burst} />
        ))}

        {/* light wash, with a soft green wave on its edge */}
        <Animated.View
          pointerEvents="none"
          style={[styles.abs, { width: floodD, height: floodD, borderRadius: floodD / 2, backgroundColor: Palette.voltSoft }, floodLeadStyle]}
        />
        <Animated.View
          pointerEvents="none"
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[styles.abs, { width: floodD, height: floodD, borderRadius: floodD / 2, overflow: 'hidden' }, floodStyle]}>
          <LinearGradient colors={['#FFFFFF', Palette.canvas]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* faint green sheen across the wash (kept outside the flood so the flood stays a cached, static layer) */}
        <View style={[StyleSheet.absoluteFill, styles.center, styles.clip]} pointerEvents="none">
          <Animated.View style={[styles.sheen, { height: height * 1.6 }, sheenStyle]}>
            <LinearGradient
              colors={['rgba(28,138,71,0)', 'rgba(28,138,71,0.07)', 'rgba(28,138,71,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* bolt: strikes bright green, deepens to the logo's green as the wash passes */}
        <Animated.View style={[styles.abs, { width: BOLT_W, height: BOLT_H }, boltStyle]} pointerEvents="none">
          {/* RGB-split glitch copies */}
          <Animated.View style={[StyleSheet.absoluteFill, ghostLime]}>
            <Svg width={BOLT_W} height={BOLT_H} viewBox="0 0 96 140">
              <Path d={BOLT_PATH} fill={LIME} />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, ghostDeep]}>
            <Svg width={BOLT_W} height={BOLT_H} viewBox="0 0 96 140">
              <Path d={BOLT_PATH} fill={Palette.forestDeep} />
            </Svg>
          </Animated.View>
          <Svg width={BOLT_W} height={BOLT_H} viewBox="0 0 96 140">
            <Path d={BOLT_PATH} fill={Palette.volt} />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, boltWhiteStyle]}>
            <Svg width={BOLT_W} height={BOLT_H} viewBox="0 0 96 140">
              <Path d={BOLT_PATH} fill={Palette.forest} />
            </Svg>
          </Animated.View>
        </Animated.View>

        {/* powered logo + tagline */}
        <Animated.View style={[styles.abs, styles.final, finalStyle]} pointerEvents="none">
          <Animated.View style={logoBStyle}>
            <BrandLogo height={124} />
          </Animated.View>
          <View style={styles.tagline}>
            {TAGLINE.map((w, i) => (
              <TaglineWord key={w} word={w} i={i} tagline={tagline} />
            ))}
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.hint, hintStyle]}>Tap to skip</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Palette.canvas },
  center: { alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },

  comet: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  cometHalo: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: Palette.volt, opacity: 0.22 },
  cometCore: { width: 16, height: 16, borderRadius: 8, backgroundColor: Palette.volt, borderWidth: 3, borderColor: Palette.white },

  odometer: { flexDirection: 'row', alignItems: 'flex-end' },
  digitBox: { width: DIGIT_W, height: DIGIT_H, overflow: 'hidden' },
  digit: {
    height: DIGIT_H,
    lineHeight: DIGIT_H,
    width: DIGIT_W,
    textAlign: 'center',
    fontFamily: Font.display,
    fontSize: 54,
    color: Palette.ink,
    includeFontPadding: false,
  },
  pct: { fontFamily: Font.displaySemi, fontSize: 24, color: Palette.mist, marginBottom: 10, marginLeft: 2 },
  labelBox: { width: 160, height: 18, marginTop: 2 },
  labelFull: { position: 'absolute', left: 0, right: 0, color: Palette.forest, fontFamily: Font.semibold },
  intake: { height: 2.5, borderRadius: 2, backgroundColor: Palette.volt },
  tickBar: { width: 2, height: 7, borderRadius: 1 },
  tickMajor: { width: 3, height: 10 },
  tickMajorLit: { width: 3, height: 16, top: -3 },
  tickDim: { backgroundColor: Palette.brandTint2, opacity: 0.6 },
  tickLit: { position: 'absolute', top: -1.5, height: 10, backgroundColor: Palette.volt },
  counterLabel: { fontFamily: Font.medium, fontSize: 13, lineHeight: 18, color: Palette.mist, letterSpacing: 0.3, textAlign: 'center' },

  sheen: { position: 'absolute', width: 140 },
  clip: { overflow: 'hidden' },

  final: { alignItems: 'center' },
  tagline: { flexDirection: 'row', gap: 5, marginTop: 20 },
  taglineWord: { fontFamily: Font.medium, fontSize: 16, color: Palette.forest, letterSpacing: 0.2 },

  hint: { position: 'absolute', bottom: 48, alignSelf: 'center', fontFamily: Font.medium, fontSize: 13, color: Palette.mist },
});
