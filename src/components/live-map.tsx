import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { liveMapHtml, type MapPadding, type MapPin } from '@/components/live-map-html';

const NO_PADDING: MapPadding = { top: 40, bottom: 40, left: 40, right: 40 };

/**
 * Free, keyless map (MapLibre + OpenFreeMap) in a WebView. Works the same in
 * Expo Go, the APK and the web build. Fits all pins into view, honouring
 * `padding` for overlays drawn on top (search bar, tab bar…).
 */
export default function LiveMap({
  pins,
  interactive = true,
  padding = NO_PADDING,
  animatePins = false,
  onPinPress,
}: {
  pins: MapPin[];
  interactive?: boolean;
  padding?: MapPadding;
  animatePins?: boolean;
  onPinPress?: (id: string) => void;
}) {
  // rebuild the page only when what's on it changes (not on every render)
  const pinsKey = pins.map((p) => `${p.id}:${p.available ? 1 : 0}`).join(',');
  const padKey = `${padding.top},${padding.bottom},${padding.left},${padding.right}`;
  const html = useMemo(
    () => liveMapHtml({ pins, interactive, padding, animatePins }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinsKey, padKey, interactive, animatePins],
  );

  return (
    <View style={[StyleSheet.absoluteFill, styles.bg]} pointerEvents={interactive ? 'auto' : 'none'}>
      <WebView
        source={{ html, baseUrl: 'https://evit.app/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={styles.bg}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.type === 'station') onPinPress?.(m.id);
          } catch {
            // ignore non-JSON messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ bg: { flex: 1, backgroundColor: '#EEF3EC' } });
