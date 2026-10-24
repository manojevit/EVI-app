/**
 * Tiny app state for the prototype, so actions actually change the UI:
 * start/stop a charging session, top up the wallet, raise tickets, save the profile.
 * Saved on the phone (no backend yet), so it survives closing the app; logging out clears it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { ConnectorKey } from '@/data/connectors';
import {
  ACCOUNT,
  SESSION_HISTORY,
  STATIONS,
  TICKETS,
  USER_LOCATION,
  VEHICLES,
  WALLET_TXNS,
  type Charger,
  type Connector,
  type Review,
  type SessionRecord,
  type Station,
  type Ticket,
  type Vehicle,
  type WalletTxn,
} from '@/data/mock';

export interface LiveSession {
  stationId: string;
  chargerId: string;
  connectorId: string;
  startedAt: number;
  /** battery % when the session started — DC chargers only (AC can't read it) */
  startSoc: number | null;
}

export interface MapFilters {
  favouritesOnly: boolean;
  availableNow: boolean;
  activeOnly: boolean;
  category: 'AC' | 'DC' | null;
  types: ConnectorKey[];
}
export const NO_FILTERS: MapFilters = { favouritesOnly: false, availableNow: false, activeOnly: false, category: null, types: [] };

interface AppState {
  session: LiveSession | null;
  walletBalance: number;
  txns: WalletTxn[];
  tickets: Ticket[];
  history: SessionRecord[];
  profile: { name: string; email: string };
  vehicles: Vehicle[];
  favourites: string[];
  filters: MapFilters;
  planId: string | null;
  /** where distances count from: the phone's GPS once known, else a demo spot in central Delhi */
  location: UserLocation;
  /** the user's own review per station (one each; submitting again replaces it) */
  myReviews: Record<string, Review>;
  /** signed in with phone + OTP; the app then opens straight to the map */
  signedIn: boolean;
  /** has seen onboarding once (kept after logging out) */
  onboarded: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  live: boolean;
}

const fresh = (): AppState => ({
  session: null,
  walletBalance: ACCOUNT.walletBalance,
  txns: WALLET_TXNS,
  tickets: TICKETS,
  history: SESSION_HISTORY,
  profile: { name: ACCOUNT.name, email: ACCOUNT.email },
  vehicles: VEHICLES,
  favourites: [],
  filters: NO_FILTERS,
  planId: null,
  location: { ...USER_LOCATION, live: false },
  myReviews: {},
  signedIn: false,
  onboarded: false,
});
let state: AppState = fresh();

const listeners = new Set<() => void>();
const set = (patch: Partial<AppState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
  save();
};

// ---- saved on the phone ----
const STORAGE_KEY = 'evit-app-state-v1';
// location comes fresh from GPS each launch, so it isn't saved
const SAVED: (keyof AppState)[] = [
  'session', 'walletBalance', 'txns', 'tickets', 'history', 'profile', 'vehicles',
  'favourites', 'filters', 'planId', 'myReviews', 'signedIn', 'onboarded',
];
let hydrated = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function save() {
  if (!hydrated) return; // never overwrite what's saved with defaults before it's been read
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const out: Partial<AppState> = {};
    for (const k of SAVED) (out as Record<string, unknown>)[k] = state[k];
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(out)).catch(() => {});
  }, 250);
}

/** Loads the saved state once at launch. Bad or missing data just leaves the defaults. */
export const hydrate: Promise<void> = (async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>;
      const patch: Partial<AppState> = {};
      for (const k of SAVED) if (saved[k] !== undefined) (patch as Record<string, unknown>)[k] = saved[k];
      // drop a session that points at a charger the app no longer knows
      if (patch.session && !findParts(patch.session)) patch.session = null;
      state = { ...state, ...patch };
    }
  } catch {
    // unreadable storage: start fresh
  }
  hydrated = true;
  listeners.forEach((l) => l());
})();

export function signIn() {
  set({ signedIn: true, onboarded: true });
}
export function finishOnboarding() {
  set({ onboarded: true });
}
/** Logs out and clears this phone's data back to the demo defaults. */
export function signOut() {
  state = { ...fresh(), onboarded: true, location: state.location };
  listeners.forEach((l) => l());
  save();
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Read a slice of app state; re-renders when it changes. */
export function useAppStore<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}
export const getAppState = () => state;

// ---- live session maths ----
const BATTERY_KWH = 82; // demo pack size used to turn energy into battery % on DC

function findParts(s: LiveSession) {
  const station = STATIONS.find((x) => x.id === s.stationId);
  const charger = station?.chargers.find((c) => c.id === s.chargerId);
  const connector = charger?.connectors.find((c) => c.id === s.connectorId);
  return station && charger && connector ? { station, charger, connector } : null;
}

export function sessionParts(s: LiveSession) {
  return findParts(s) as { station: Station; charger: Charger; connector: Connector };
}

/**
 * Live numbers for a running session at time `now`. Charging stops by itself when the
 * battery is full, so a session left running for days doesn't keep adding energy and cost.
 */
export function sessionReadout(s: LiveSession, now = Date.now()) {
  const { station, charger } = sessionParts(s);
  const dc = charger.current === 'DC';
  const ratedKw = dc ? +(charger.powerKw * 0.75).toFixed(1) : +(Math.min(charger.powerKw, 7.4) * 0.46).toFixed(1);
  // energy until full: DC knows the starting %; AC assumes the car arrived at about 40%
  const roomKwh = BATTERY_KWH * (1 - (dc && s.startSoc != null ? s.startSoc : 40) / 100);
  const fullAfter = Math.round((roomKwh / ratedKw) * 3600);
  const elapsed = Math.max(0, Math.floor((now - s.startedAt) / 1000));
  const full = elapsed >= fullAfter;
  const seconds = Math.min(elapsed, fullAfter);
  const energyKwh = (ratedKw * seconds) / 3600;
  const costINR = energyKwh * station.pricePerKwh;
  const soc = dc && s.startSoc != null ? Math.min(100, s.startSoc + (energyKwh / BATTERY_KWH) * 100) : null;
  return { dc, powerKw: full ? 0 : ratedKw, seconds, energyKwh, costINR, soc, full };
}

export const formatDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s).padStart(2, '0')}s`;
};

// ---- actions ----
export function startSession(stationId: string, chargerId: string, connectorId: string) {
  const station = STATIONS.find((x) => x.id === stationId);
  const charger = station?.chargers.find((c) => c.id === chargerId);
  set({
    session: {
      stationId,
      chargerId,
      connectorId,
      startedAt: Date.now(),
      startSoc: charger?.current === 'DC' ? 34 : null, // demo starting battery %
    },
  });
}

/**
 * Demo: show an AC or a DC session straight away (for walkthroughs), already
 * running for a while so the numbers look real.
 */
export function showDemoSession(kind: 'AC' | 'DC') {
  set({
    session:
      kind === 'AC'
        ? { stationId: 'evi-test-1', chargerId: 'ch2', connectorId: 'c1', startedAt: Date.now() - (19 * 60 + 23) * 1000, startSoc: null }
        : { stationId: 'demo-hub-north', chargerId: 'ch1', connectorId: 'c1', startedAt: Date.now() - 12 * 60 * 1000, startSoc: 34 },
  });
}

/** Ends the session, charges the wallet, files it in history and returns the record id. */
export function stopSession(): string | null {
  const s = state.session;
  if (!s) return null;
  const { station, charger, connector } = sessionParts(s);
  const r = sessionReadout(s);
  const when = new Date();
  const dateLabel = when.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  const id = `h${when.getTime()}`;
  const record: SessionRecord = {
    id,
    station: station.name,
    connectorLabel: `${charger.serial} · Connector ${connector.number}`,
    dateLabel,
    costINR: +r.costINR.toFixed(2),
    energyKwh: +r.energyKwh.toFixed(2),
    reason: 'Stopped from the app',
  };
  set({
    session: null,
    history: [record, ...state.history],
    walletBalance: +(state.walletBalance - record.costINR).toFixed(2),
    txns: [{ id: `w${when.getTime()}`, kind: 'charge', title: `Charging · ${station.name}`, dateLabel, amount: -record.costINR }, ...state.txns],
  });
  return id;
}

export function addMoney(amount: number, method: 'UPI' | 'Card') {
  const dateLabel = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  set({
    walletBalance: +(state.walletBalance + amount).toFixed(2),
    txns: [{ id: `w${Date.now()}`, kind: 'topup', title: `Added via ${method}`, dateLabel, amount }, ...state.txns],
  });
}

export function addTicket(t: { title: string; body: string; priority: string }) {
  const id = `t${Date.now()}`;
  const dateLabel = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  set({ tickets: [{ id, title: t.title, body: t.body, priority: t.priority, status: 'Open', dateLabel }, ...state.tickets] });
  return id;
}

export function saveProfile(p: { name: string; email: string }) {
  set({ profile: p });
}

export function addVehicle(v: Omit<Vehicle, 'id'>) {
  set({ vehicles: [...state.vehicles, { ...v, id: `v${Date.now()}` }] });
}

export function removeVehicle(id: string) {
  set({ vehicles: state.vehicles.filter((v) => v.id !== id) });
}

export function toggleFavourite(stationId: string) {
  const has = state.favourites.includes(stationId);
  set({ favourites: has ? state.favourites.filter((x) => x !== stationId) : [...state.favourites, stationId] });
}

export function setFilters(patch: Partial<MapFilters>) {
  set({ filters: { ...state.filters, ...patch } });
}
export const activeFilterCount = (f: MapFilters) =>
  [f.favouritesOnly, f.availableNow, f.activeOnly, f.category != null].filter(Boolean).length + f.types.length;

/** Does a station pass the map filters? */
export function stationMatches(s: Station, f: MapFilters, favourites: string[]) {
  const connectors = s.chargers.flatMap((c) => (c.online ? c.connectors : []));
  if (f.favouritesOnly && !favourites.includes(s.id)) return false;
  if (f.availableNow && !connectors.some((c) => c.availability === 'Available')) return false;
  if (f.activeOnly && !s.active) return false;
  if (f.category && !s.chargers.some((c) => c.current === f.category && c.online)) return false;
  if (f.types.length && !s.chargers.some((c) => c.connectors.some((x) => f.types.includes(x.type)))) return false;
  return true;
}

/** Subscribe to a plan, paid from the wallet. Returns false if the balance is too low. */
export function subscribePlan(plan: { id: string; name: string; priceINR: number }) {
  if (state.walletBalance < plan.priceINR) return false;
  const dateLabel = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  set({
    planId: plan.id,
    walletBalance: +(state.walletBalance - plan.priceINR).toFixed(2),
    txns: [{ id: `w${Date.now()}`, kind: 'plan', title: `${plan.name} · monthly`, dateLabel, amount: -plan.priceINR }, ...state.txns],
  });
  return true;
}

export function setLocation(latitude: number, longitude: number) {
  set({ location: { latitude, longitude, live: true } });
}

export function submitReview(stationId: string, r: { stars: number; text: string; tags: string[] }) {
  const review: Review = {
    id: `me-${stationId}`,
    name: state.profile.name,
    stars: r.stars,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    text: r.text.trim(),
    tags: r.tags,
  };
  set({ myReviews: { ...state.myReviews, [stationId]: review } });
}
