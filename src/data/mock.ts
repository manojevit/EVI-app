/**
 * Static sample data for the EVIT prototype.
 * No network — everything the UI shows comes from here.
 *
 * Model: Station → Chargers (one physical unit, AC or DC, with a serial)
 *                → Connectors (the plugs on that charger).
 */

import { CONNECTORS, CONNECTOR_KEYS, type ConnectorKey } from '@/data/connectors';
import type { VehicleType } from '@/data/vehicles';

export type ConnectorStatus = 'Available' | 'Unavailable' | 'Charging';
export type StationStatus = 'Available' | 'Busy' | 'Offline';

export interface Connector {
  id: string;
  number: number; // position on the charger: 1, 2 …
  type: ConnectorKey;
  availability: ConnectorStatus;
}

export interface Charger {
  id: string;
  serial: string; // e.g. EVIT-05
  current: 'AC' | 'DC';
  powerKw: number;
  online: boolean;
  connectors: Connector[];
}

export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  pricePerKwh: number;
  status: StationStatus;
  active: boolean;
  category: 'AC' | 'DC';
  favourite: boolean;
  hours: string;
  phone: string;
  latitude: number;
  longitude: number;
  chargers: Charger[];
}

export const STATIONS: Station[] = [
  {
    id: 'evi-test-1',
    name: 'EVI-Test-1',
    address: 'innohouse, sector 32, gurgaon',
    city: 'Gurugram',
    pricePerKwh: 10,
    status: 'Available',
    active: true,
    category: 'AC',
    favourite: false,
    hours: '08:00 – 22:00',
    phone: '+91 98110 20032',
    latitude: 28.4595,
    longitude: 77.0266,
    chargers: [
      {
        id: 'ch1', serial: 'EVIT-03', current: 'DC', powerKw: 30, online: true,
        connectors: [
          { id: 'c1', number: 1, type: 'ccs', availability: 'Available' },
          { id: 'c2', number: 2, type: 'dc001', availability: 'Available' },
        ],
      },
      {
        id: 'ch2', serial: 'EVIT-05', current: 'AC', powerKw: 7.4, online: true,
        connectors: [
          { id: 'c1', number: 1, type: 'type2', availability: 'Charging' },
          { id: 'c2', number: 2, type: 'iec', availability: 'Available' },
        ],
      },
      {
        id: 'ch3', serial: 'EVIT-01', current: 'AC', powerKw: 7.4, online: false,
        connectors: [
          { id: 'c1', number: 1, type: 'type2', availability: 'Unavailable' },
          { id: 'c2', number: 2, type: 'bevc', availability: 'Unavailable' },
        ],
      },
    ],
  },
  {
    id: 'demo-hub-north',
    name: 'EVIT Demo Hub North',
    address: 'NH-44, North Delhi',
    city: 'New Delhi',
    pricePerKwh: 12,
    status: 'Available',
    active: true,
    category: 'DC',
    favourite: false,
    hours: '24 Hours',
    phone: '+91 98110 20044',
    latitude: 28.7515,
    longitude: 77.1205,
    chargers: [
      {
        id: 'ch1', serial: 'HUBN-01', current: 'DC', powerKw: 60, online: true,
        connectors: [
          { id: 'c1', number: 1, type: 'ccs', availability: 'Available' },
          { id: 'c2', number: 2, type: 'chademo', availability: 'Available' },
        ],
      },
      {
        id: 'ch2', serial: 'HUBN-02', current: 'AC', powerKw: 22, online: true,
        connectors: [{ id: 'c1', number: 1, type: 'type2', availability: 'Available' }],
      },
    ],
  },
  {
    id: 'demo-hub-south',
    name: 'EVIT Demo Hub South',
    address: 'MG Road, South Delhi',
    city: 'New Delhi',
    pricePerKwh: 12,
    status: 'Available',
    active: true,
    category: 'DC',
    favourite: false,
    hours: '24 Hours',
    phone: '+91 98110 20051',
    latitude: 28.5245,
    longitude: 77.2066,
    chargers: [
      {
        id: 'ch1', serial: 'HUBS-01', current: 'DC', powerKw: 60, online: true,
        connectors: [
          { id: 'c1', number: 1, type: 'ccs', availability: 'Available' },
          { id: 'c2', number: 2, type: 'gbt', availability: 'Charging' },
        ],
      },
    ],
  },
  {
    id: 'evit-test',
    name: 'EVIT TEST',
    address: 'DELHI',
    city: 'New Delhi',
    pricePerKwh: 9,
    status: 'Available',
    active: true,
    category: 'AC',
    favourite: false,
    hours: '09:00 – 21:00',
    phone: '+91 98110 20060',
    latitude: 28.6139,
    longitude: 77.209,
    chargers: [
      {
        id: 'ch1', serial: 'TEST-01', current: 'AC', powerKw: 7.4, online: true,
        connectors: [{ id: 'c1', number: 1, type: 'type2', availability: 'Available' }],
      },
    ],
  },
  {
    id: 'iit-delhi-99c',
    name: 'iit delhi 99c',
    address: '99c 2',
    city: 'New Delhi',
    pricePerKwh: 11,
    status: 'Available',
    active: true,
    category: 'AC',
    favourite: false,
    hours: '08:00 – 20:00',
    phone: '+91 98110 20071',
    latitude: 28.5456,
    longitude: 77.1926,
    chargers: [
      {
        id: 'ch1', serial: 'IITD-01', current: 'AC', powerKw: 3.3, online: true,
        connectors: [
          { id: 'c1', number: 1, type: 'iec', availability: 'Available' },
          { id: 'c2', number: 2, type: 'bevc', availability: 'Available' },
        ],
      },
    ],
  },
  {
    id: 'krishna-vihar',
    name: 'Krishna Vihar Colony',
    address: 'Krishna Vihar, Nangloi, New Delhi 110041',
    city: 'New Delhi',
    pricePerKwh: 10,
    status: 'Available',
    active: true,
    category: 'DC',
    favourite: false,
    hours: '24 Hours',
    phone: '+91 98110 20082',
    latitude: 28.6826,
    longitude: 77.0646,
    chargers: [
      {
        id: 'ch1', serial: 'KV-01', current: 'DC', powerKw: 30, online: true,
        connectors: [{ id: 'c1', number: 1, type: 'ccs', availability: 'Available' }],
      },
      {
        id: 'ch2', serial: 'KV-02', current: 'AC', powerKw: 7.4, online: false,
        connectors: [{ id: 'c1', number: 1, type: 'type2', availability: 'Unavailable' }],
      },
    ],
  },
];

// ---- Station helpers ----
export const stationConnectors = (s: Station) => s.chargers.flatMap((ch) => ch.connectors);
export const freeConnectorCount = (s: Station) =>
  stationConnectors(s).filter((c) => c.availability === 'Available').length;
export const maxPowerKw = (s: Station) => Math.max(...s.chargers.map((ch) => ch.powerKw));
export const connectorTypesAt = (s: Station) =>
  CONNECTOR_KEYS.filter((k) => stationConnectors(s).some((c) => c.type === k));

// Prototype has no GPS: distances are straight-line from a sample spot in central Delhi.
export const USER_LOCATION = { latitude: 28.6315, longitude: 77.2167 };
export function distanceKm(s: Station, from = USER_LOCATION) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(s.latitude - from.latitude);
  const dLon = rad(s.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(s.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// Find a charger by the ID printed on it (or encoded in its QR). Ignores case, spaces and dashes.
const normalizeId = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');
export function findCharger(input: string) {
  const want = normalizeId(input);
  if (!want) return null;
  for (const station of STATIONS) {
    const charger = station.chargers.find((ch) => want.includes(normalizeId(ch.serial)));
    if (charger) return { station, charger };
  }
  return null;
}
export const ALL_CHARGER_IDS = STATIONS.flatMap((s) => s.chargers.map((ch) => ch.serial));

export const directionsUrl = (s: Station) =>
  `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  group: 'TODAY' | 'EARLIER';
}

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'test on 12 aug', body: 'Message sent by admin on 12 aug', timeAgo: '3 h ago', group: 'TODAY' },
];

export const ACCOUNT = {
  name: 'Manoj Tarad',
  phone: '+917877018453',
  email: 'manojtarad65@gmail.com',
  initial: 'M',
  walletBalance: 16289.0,
};

// ---- Active charging session (Sessions tab, live view) ----
export const ACTIVE_SESSION = {
  stationName: 'EVI-Test-1',
  connectorLabel: 'EVIT-05 · Connector 1',
  mode: 'AC CHARGING',
  powerKw: 3.4,
  energyKwh: 1.08,
  duration: '19m 23s',
  costINR: 10.8,
  status: 'Charging' as const,
};

// Small pill above the tab bar showing the running session.
export const MINI_SESSION = { stationName: 'EVI-Test-1', energyKwh: 1.1 };

// ---- Vehicles ----
export interface Vehicle {
  id: string;
  type: VehicleType;
  make: string;
  model: string;
  plate?: string;
  connectors: ConnectorKey[];
}
// BYD Seal supports Type-2 (AC) and CCS (DC), per the vehicle connector list.
export const VEHICLES: Vehicle[] = [
  { id: 'v1', type: 'LMV', make: 'BYD', model: 'BYD Seal', plate: 'DL 3C AB 4521', connectors: ['type2', 'ccs'] },
];

export const MANUFACTURERS = [
  'Tata', 'MG', 'Hyundai', 'BYD', 'Kia', 'Mahindra', 'Mercedes-Benz', 'BMW', 'Audi', 'Other',
];
export const VEHICLE_YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', 'Older'];

// ---- Subscription plans ----
export interface Plan {
  id: string;
  name: string;
  priceINR: number;
  period: string;
  summary: string;
  kwh: number;
  scope: string;
}
export const PLANS: Plan[] = [
  { id: 'lite', name: 'EVIT Lite', priceINR: 199, period: 'mo · 30d', summary: '20 kWh/month, app support', kwh: 20, scope: 'ALL' },
  { id: 'plus', name: 'EVIT Plus', priceINR: 499, period: 'mo · 30d', summary: '60 kWh/month, priority AC + DC charging', kwh: 60, scope: 'ALL' },
];

// ---- Session history (completed) ----
export interface SessionRecord {
  id: string;
  station: string;
  connectorLabel: string;
  dateLabel: string;
  costINR: number;
  energyKwh: number;
  reason: string;
}
export const HISTORY_MONTH = { label: 'OCTOBER 2026', totalKwh: 18.39, totalINR: 186.29 };
export const SESSION_HISTORY: SessionRecord[] = [
  { id: 'h1', station: 'EVI-Test-1', connectorLabel: 'EVIT-05 · Connector 1', dateLabel: '22 Oct 2026, 15:07', costINR: 23.7, energyKwh: 2.37, reason: 'Stopped from the app' },
  { id: 'h2', station: 'EVI-Test-1', connectorLabel: 'EVIT-05 · Connector 1', dateLabel: '22 Oct 2026, 12:27', costINR: 17.7, energyKwh: 1.77, reason: 'Reached your time limit' },
  { id: 'h3', station: 'EVI-Test-1', connectorLabel: 'EVIT-05 · Connector 1', dateLabel: '22 Oct 2026, 10:47', costINR: 17.1, energyKwh: 1.71, reason: 'Reached your time limit' },
  { id: 'h4', station: 'EVI-Test-1', connectorLabel: 'EVIT-05 · Connector 1', dateLabel: '12 Oct 2026, 14:24', costINR: 17.8, energyKwh: 1.78, reason: 'Stopped from the app' },
];

// ---- Cancelled / expired reservations ----
export interface CancelledRecord {
  id: string;
  ref: string;
  expiredLabel: string;
}
export const CANCELLED_SESSIONS: CancelledRecord[] = [
  { id: 'x1', ref: '61d6f789-3b13-40d5-...', expiredLabel: 'Expired 12 Oct, 14:32' },
  { id: 'x2', ref: '61d6f789-3b13-40d5-...', expiredLabel: 'Expired 12 Oct, 13:20' },
  { id: 'x3', ref: '61d6f789-3b13-40d5-...', expiredLabel: 'Expired 12 Oct, 12:30' },
  { id: 'x4', ref: '61d6f789-3b13-40d5-...', expiredLabel: 'Expired 10 Oct, 15:46' },
];

// ---- Support tickets ----
export interface Ticket {
  id: string;
  title: string;
  dateLabel: string;
  priority: string;
  status: string;
  body: string;
}
export const TICKETS: Ticket[] = [
  { id: 't1', title: 'Very little energy delivered', dateLabel: '12 Oct 2026', priority: 'Medium priority', status: 'Open', body: 'Auto-raised for session 96b42534-f1b3-46ad-83fa-bed06896c13c on charger EVIT-05.' },
  { id: 't2', title: 'Very little energy delivered', dateLabel: '12 Oct 2026', priority: 'Medium priority', status: 'Open', body: 'Auto-raised for session 2854f038-c715-4f8f-a337-3dcac3fa3bfd on charger EVIT-05.' },
  { id: 't3', title: 'Charging session ended very early', dateLabel: '10 Oct 2026', priority: 'Medium priority', status: 'Open', body: 'Auto-raised for session 6d76abe3-82a9-448e-a91e-fe83ec373664 on charger EVIT-05.' },
  { id: 't4', title: 'Charging session ended very early', dateLabel: '10 Oct 2026', priority: 'Medium priority', status: 'Open', body: 'Auto-raised for session 1f2a9c70-11bb-4e3a-9f0d-aa2290 be0c21 on charger EVIT-05.' },
];

// Filter sheet options
export const CATEGORIES = ['AC', 'DC'] as const;

// The 7 official connector types, as labels for the filter chips.
export const CONNECTOR_TYPES = CONNECTOR_KEYS.map((k) => CONNECTORS[k].label);

export const formatINR = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
