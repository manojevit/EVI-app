import { useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { liveMapHtml, type MapCommand, type MapPadding, type MapPin, type MapPoint } from '@/components/live-map-html';

const NO_PADDING: MapPadding = { top: 40, bottom: 40, left: 40, right: 40 };

export type LiveMapHandle = { send: (c: MapCommand) => void };

/**
 * Free, keyless map (MapLibre + OpenFreeMap) in a WebView. Works the same in
 * Expo Go, the APK and the web build. Fits all pins into view, honouring
 * `padding` for overlays drawn on top (search bar, tab bar…). After load,
 * move it with `ref.send(...)` (select a pin, move the car, re-fit).
 */
export default function LiveMap({
  ref,
  pins,
  interactive = true,
  padding = NO_PADDING,
  animatePins = false,
  user = null,
  fit,
  onPinPress,
}: {
  ref?: Ref<LiveMapHandle>;
  pins: MapPin[];
  interactive?: boolean;
  padding?: MapPadding;
  animatePins?: boolean;
  /** "you are here" car; later moves go through send({type:'user'}) so the page isn't rebuilt */
  user?: MapPoint | null;
  fit?: [number, number][];
  onPinPress?: (id: string) => void;
}) {
  const web = useRef<WebView<object>>(null);
  // rebuild the page only when what's on it changes (not on every render)
  const pinsKey = pins.map((p) => `${p.id}:${p.available ? 1 : 0}`).join(',');
  const padKey = `${padding.top},${padding.bottom},${padding.left},${padding.right}`;
  const html = useMemo(
    () => liveMapHtml({ pins, interactive, padding, animatePins, user, fit }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinsKey, padKey, interactive, animatePins],
  );

  // commands wait until the page says it's ready (a GPS fix can arrive before the map has loaded)
  const ready = useRef(false);
  const queue = useRef<MapCommand[]>([]);
  const run = (c: MapCommand) => web.current?.injectJavaScript(`window.__cmd && window.__cmd(${JSON.stringify(c)}); true;`);
  useImperativeHandle(ref, () => ({
    send: (c) => (ready.current ? run(c) : queue.current.push(c)),
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.bg]} pointerEvents={interactive ? 'auto' : 'none'}>
      <WebView
        ref={web}
        source={{ html, baseUrl: 'https://evit.app/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={styles.bg}
        onLoadStart={() => {
          ready.current = false;
        }}
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.type === 'station') onPinPress?.(m.id);
            if (m.type === 'ready') {
              ready.current = true;
              queue.current.splice(0).forEach(run);
            }
          } catch {
            // ignore non-JSON messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ bg: { flex: 1, backgroundColor: '#EEF3EC' } });
