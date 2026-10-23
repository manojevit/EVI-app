import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { ONBOARDING_CAMERA } from '@/constants/map-style';

/**
 * Web build: a real Google map embed centred on the same camera as the native
 * map, so the overlay pins line up. Pointer events are off so swipes still page.
 */
export default function OnboardingMap() {
  const { latitude, longitude, zoom } = ONBOARDING_CAMERA;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E4EBE1' }]} pointerEvents="none">
      {createElement('iframe', {
        src: `https://maps.google.com/maps?ll=${latitude},${longitude}&z=${zoom}&output=embed`,
        style: { border: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' },
        title: 'EVIT stations in Delhi NCR',
        tabIndex: -1,
      })}
    </View>
  );
}
