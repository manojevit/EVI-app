import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { MAP_STYLE, ONBOARDING_CAMERA } from '@/constants/map-style';
import { Palette } from '@/constants/theme';

// react-native-maps is a native module not present in Expo Go (see station-map.tsx).
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Maps: any = null;
if (!IS_EXPO_GO) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Maps = require('react-native-maps');
  } catch {
    Maps = null;
  }
}

/** Street sketch used where the Google map can't load (Expo Go). */
function StreetSketch() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#EEF3EC' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 340 300" preserveAspectRatio="xMidYMid slice">
        <Path d="M-10 70 C 80 40, 160 120, 350 80" stroke={Palette.white} strokeWidth={14} fill="none" />
        <Path d="M40 -10 C 90 90, 60 190, 120 320" stroke={Palette.white} strokeWidth={10} fill="none" />
        <Path d="M-10 210 C 110 170, 220 250, 350 190" stroke={Palette.white} strokeWidth={12} fill="none" />
        <Path d="M250 -10 C 230 100, 290 180, 260 320" stroke={Palette.white} strokeWidth={8} fill="none" />
      </Svg>
    </View>
  );
}

/**
 * Background for onboarding slide 1: a real, non-interactive Google map of Delhi NCR
 * in the app's map style (Android lite mode renders it as a light static bitmap).
 * Pins are drawn on top by the slide, using projectFromCenter().
 */
export default function OnboardingMap() {
  if (!Maps) return <StreetSketch />;
  const MapView = Maps.default;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Maps.PROVIDER_GOOGLE}
        liteMode
        initialCamera={{
          center: { latitude: ONBOARDING_CAMERA.latitude, longitude: ONBOARDING_CAMERA.longitude },
          zoom: ONBOARDING_CAMERA.zoom,
          heading: 0,
          pitch: 0,
        }}
        customMapStyle={MAP_STYLE}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
      />
    </View>
  );
}
