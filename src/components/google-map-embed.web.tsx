import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { STATIONS_CAMERA, embedUrl } from '@/constants/map-style';

/** Web build: the same keyless Google embed as an iframe. Pointer events pass through to the pins. */
export default function GoogleMapEmbed({ camera = STATIONS_CAMERA }: { camera?: typeof STATIONS_CAMERA }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#E4EBE1' }]} pointerEvents="none">
      {createElement('iframe', {
        src: embedUrl(camera),
        style: { border: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' },
        title: 'Google map',
        tabIndex: -1,
      })}
    </View>
  );
}
