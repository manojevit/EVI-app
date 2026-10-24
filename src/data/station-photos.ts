/**
 * Photos shown on the station page (auto-sliding gallery) and the station list.
 * Placeholders until real station photos arrive; sources in assets/images/stations/SOURCES.md.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const P = {
  evit: require('@/assets/images/stations/evit-charger.jpg'),
  carsPluggedIn: require('@/assets/images/stations/cars-plugged-in.jpg'),
  ringPost: require('@/assets/images/stations/green-ring-post.jpg'),
  lawnPost: require('@/assets/images/stations/lawn-post.jpg'),
  evBays: require('@/assets/images/stations/ev-bays.jpg'),
  highway: require('@/assets/images/stations/highway-canopy.jpg'),
  solar: require('@/assets/images/stations/solar-canopy.jpg'),
  greenBays: require('@/assets/images/stations/green-bays.jpg'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

export type StationPhoto = { source: number; caption: string };

const BY_STATION: Record<string, StationPhoto[]> = {
  'evi-test-1': [
    { source: P.evit, caption: 'EVIT charger, covered parking' },
    { source: P.carsPluggedIn, caption: 'Charging bays' },
    { source: P.ringPost, caption: 'AC charge point' },
    { source: P.greenBays, caption: 'Reserved EV parking' },
  ],
  'demo-hub-north': [
    { source: P.highway, caption: 'Highway charging canopy' },
    { source: P.evit, caption: 'EVIT charger' },
    { source: P.evBays, caption: 'EV-only bays' },
  ],
  'demo-hub-south': [
    { source: P.solar, caption: 'Solar-powered canopy' },
    { source: P.evit, caption: 'EVIT charger' },
    { source: P.carsPluggedIn, caption: 'Charging bays' },
    { source: P.greenBays, caption: 'Reserved EV parking' },
  ],
  'evit-test': [
    { source: P.evit, caption: 'EVIT charger' },
    { source: P.lawnPost, caption: 'Charge point' },
    { source: P.evBays, caption: 'EV-only bays' },
  ],
  'iit-delhi-99c': [
    { source: P.ringPost, caption: 'Campus charge point' },
    { source: P.evit, caption: 'EVIT charger' },
    { source: P.lawnPost, caption: 'Charge point' },
  ],
  'krishna-vihar': [
    { source: P.evBays, caption: 'EV-only bays' },
    { source: P.evit, caption: 'EVIT charger' },
    { source: P.greenBays, caption: 'Reserved EV parking' },
  ],
};

export const stationPhotos = (stationId: string): StationPhoto[] => BY_STATION[stationId] ?? [{ source: P.evit, caption: 'EVIT charger' }];
