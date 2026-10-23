import { useEffect, useRef, useState } from 'react';

// Once the native map has failed in this session, later screens go straight to the embed.
let nativeMapFailed = false;

/**
 * Gives the native Google map a few seconds to finish loading. If it never does —
 * typically because Google rejected the API key (blank grey map) — `failed` turns
 * true so the caller can show the keyless Google embed instead of a blank screen.
 */
export function useMapFallback({ timeoutMs = 6000, remember = true } = {}) {
  const loaded = useRef(false);
  const [failed, setFailed] = useState(remember && nativeMapFailed);

  useEffect(() => {
    if (remember && nativeMapFailed) return;
    const t = setTimeout(() => {
      if (!loaded.current) {
        if (remember) nativeMapFailed = true;
        setFailed(true);
      }
    }, timeoutMs);
    return () => clearTimeout(t);
  }, [timeoutMs, remember]);

  const onMapLoaded = () => {
    loaded.current = true;
  };
  return { failed, onMapLoaded };
}
