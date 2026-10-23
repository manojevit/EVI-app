import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import GoogleMapEmbed from '@/components/google-map-embed';
import { MAP_STYLE, STATIONS_CAMERA } from '@/constants/map-style';

// react-native-maps can't use our Maps key in Expo Go (see station-map.tsx).
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

/**
 * Background for onboarding slide 1: a real, non-interactive Google map of Delhi NCR.
 * App build: the native SDK in the app's map style (Android lite mode = light static bitmap).
 * Expo Go: Google's keyless embed on the same camera.
 * Pins are drawn on top by the slide, using projectFromCenter().
 */
export default function OnboardingMap() {
  if (!Maps) return <GoogleMapEmbed />;
  const MapView = Maps.default;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Maps.PROVIDER_GOOGLE}
        liteMode
        initialCamera={{
          center: { latitude: STATIONS_CAMERA.latitude, longitude: STATIONS_CAMERA.longitude },
          zoom: STATIONS_CAMERA.zoom,
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
