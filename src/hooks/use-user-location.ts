import * as Location from 'expo-location';
import { useEffect } from 'react';

import { setLocation, useAppStore } from '@/data/app-store';

let asked = false; // ask once per app session, not on every map visit

/**
 * The phone's position for "you are here" and distances. Asks for permission the
 * first time; if it's refused or GPS fails, the store keeps the demo spot in Delhi.
 */
export function useUserLocation() {
  const location = useAppStore((st) => st.location);

  useEffect(() => {
    if (asked) return;
    asked = true;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        // a quick last-known fix first, then a fresh one
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last && !cancelled) setLocation(last.coords.latitude, last.coords.longitude);
        const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) setLocation(now.coords.latitude, now.coords.longitude);
      } catch {
        // keep the demo location
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
