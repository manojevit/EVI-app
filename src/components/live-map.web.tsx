import { createElement, useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';

import { liveMapHtml, type MapCommand, type MapPadding, type MapPin, type MapPoint } from '@/components/live-map-html';
import type { LiveMapHandle } from '@/components/live-map';

const NO_PADDING: MapPadding = { top: 40, bottom: 40, left: 40, right: 40 };

/** Web build: the same free MapLibre + OpenFreeMap page in an iframe. */
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
  user?: MapPoint | null;
  fit?: [number, number][];
  onPinPress?: (id: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const pinsKey = pins.map((p) => `${p.id}:${p.available ? 1 : 0}`).join(',');
  const padKey = `${padding.top},${padding.bottom},${padding.left},${padding.right}`;
  const html = useMemo(
    () => liveMapHtml({ pins, interactive, padding, animatePins, user, fit }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinsKey, padKey, interactive, animatePins],
  );

  // A blob: URL (not srcdoc) gives the page a real origin, which MapLibre's tile workers need.
  const src = useMemo(() => URL.createObjectURL(new Blob([html], { type: 'text/html' })), [html]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  // commands wait until the page says it's ready (a GPS fix can arrive before the map has loaded)
  const ready = useRef(false);
  const queue = useRef<MapCommand[]>([]);
  const run = (c: MapCommand) => frame.current?.contentWindow?.postMessage(JSON.stringify(c), '*');
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => {
    ready.current = false; // a new page is loading
  }, [src]);
  useImperativeHandle(ref, () => ({
    send: (c: MapCommand) => (ready.current ? run(c) : queue.current.push(c)),
  }));

  const onPinPressRef = useRef(onPinPress);
  onPinPressRef.current = onPinPress;
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const m = JSON.parse(e.data);
        if (m.type === 'station') onPinPressRef.current?.(m.id);
        if (m.type === 'ready') {
          ready.current = true;
          queue.current.splice(0).forEach((c) => runRef.current(c));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#EEF3EC' }]} pointerEvents={interactive ? 'auto' : 'none'}>
      {createElement('iframe', {
        ref: frame,
        src,
        title: 'Map of EVIT stations',
        tabIndex: -1,
        style: { border: 0, width: '100%', height: '100%', display: 'block', pointerEvents: interactive ? 'auto' : 'none' },
      })}
    </View>
  );
}
