import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Station } from '@/data/mock';

/**
 * Web build: embed a real Google map (no key needed) so previews show actual
 * tiles. On device, station-map.tsx renders react-native-maps with the custom
 * style + glowing pins.
 */
export default function StationMap(_props: { stations: Station[] }) {
  return (
    <View style={styles.map}>
      {createElement('iframe', {
        src: 'https://maps.google.com/maps?q=28.62,77.17&z=10&output=embed',
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
        title: 'EVIT station map',
      })}
    </View>
  );
}

const styles = StyleSheet.create({ map: { flex: 1, backgroundColor: '#E4EBE1' } });
