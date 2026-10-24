/**
 * Tiny app state for the prototype, so actions actually change the UI:
 * start/stop a charging session, top up the wallet, raise tickets, save the profile.
 * Saved on the phone (no backend yet), so it survives closing the app; logging out clears it.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { ConnectorKey } from '@/data/connectors';
import { cancelReminders, remind } from '@/data/reminders';
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
  /** stop after this many minutes; null/absent = until the battery is full */
  limitMins?: number | null;
}

/** Charge or hold lengths offered on the start sheet. */
export const TIME_OPTIONS = [15, 30, 45, 60] as const;

/**
 * Reservation rules, modelled on how networks run them (e.g. EVgo holds a booked charger
 * 20 minutes past its start time, then releases it and keeps a no-show fee; OCPP's
 * ReserveNow holds a connector until an expiry the operator chooses):
 * short holds so busy chargers aren't blocked, one at a time, a few a day.
 */
export const HOLD_OPTIONS = [10, 15, 20, 30] as const;
export const MAX_RESERVATIONS_PER_DAY = 3;

export interface Reservation {
  id: string;
  stationId: string;
  chargerId: string;
  connectorId: string;
  /** when the hold starts (the moment it's booked) */
  startAt: number;
  holdMins: number;
  feeINR: number;
  /** 'booked' turns into upcoming / held / expired by the clock — see reservationState */
  status: 'booked' | 'used' | 'cancelled';
  /** 'now' holds from booking; 'later' is a time slot booked ahead */
  kind?: 'now' | 'later';
  bookedAt?: number;
  /** phone reminders still to fire, cancelled if the booking ends early */
  reminderIds?: string[];
}
export type ReservationState = 'upcoming' | 'held' | 'expired' | 'used' | 'cancelled';
/** Booking fee: still to be agreed with EVIT, so nothing is charged or shown yet (0 = free). */
export const RESERVATION_FEE = 0;
/** After the hold ends, the driver still has this long to plug in before it's released. */
export const GRACE_MINS = 10;
/** A slot booked for later is held this long from its start (then the grace period). */
export const SLOT_HOLD_MINS = 15;
export const SLOT_DAYS_AHEAD = 7;
/** Missed reservations in a week that pause booking, and for how long. */
export const NO_SHOW_LIMIT = 2;
export const NO_SHOW_PAUSE_HOURS = 24;

/** A reminder or update shown in the app's Notifications list (and as a phone notification). */
export interface InboxItem {
  id: string;
  title: string;
  body: string;
  /** when it appears; future items wait until then */
  at: number;
  reservationId?: string;
}

export interface RfidCard {
  id: string;
  /** chip id printed on the back of the card, hex without spaces (empty while an ordered card is on its way) */
  uid: string;
  name: string;
  status: 'active' | 'blocked' | 'ordered';
  vehicleId?: string;
  addedLabel: string;
}
export const RFID_CARD_PRICE = 199;

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
  /** notification ids the user has marked read */
  readNotifications: string[];
  reservations: Reservation[];
  rfidCards: RfidCard[];
  inbox: InboxItem[];
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
  readNotifications: [],
  reservations: demoReservations(),
  inbox: [],
  rfidCards: [{ id: 'rf1', uid: '04A13F9C2B7E81', name: 'My EVIT card', status: 'active', vehicleId: 'v1', addedLabel: 'Added 12 Oct 2026' }],
});

// a few past bookings so the history isn't empty on a fresh install
function demoReservations(): Reservation[] {
  const at = (iso: string) => new Date(iso).getTime();
  return [
    { id: 'rs3', stationId: 'demo-hub-north', chargerId: 'ch1', connectorId: 'c1', startAt: at('2026-10-21T18:30:00+05:30'), holdMins: 30, feeINR: RESERVATION_FEE, status: 'used' },
    { id: 'rs2', stationId: 'evi-test-1', chargerId: 'ch2', connectorId: 'c1', startAt: at('2026-10-17T09:15:00+05:30'), holdMins: 15, feeINR: RESERVATION_FEE, status: 'booked' },
    { id: 'rs1', stationId: 'evi-test-1', chargerId: 'ch2', connectorId: 'c1', startAt: at('2026-10-12T13:00:00+05:30'), holdMins: 30, feeINR: RESERVATION_FEE, status: 'cancelled' },
  ];
}
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
  'favourites', 'filters', 'planId', 'myReviews', 'signedIn', 'onboarded', 'readNotifications', 'reservations', 'rfidCards', 'inbox',
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
export function markNotificationsRead(ids: string[]) {
  set({ readNotifications: [...new Set([...state.readNotifications, ...ids])] });
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

const DEMO_START_SOC = 34; // battery % a new DC session starts from in the demo
const ratedKwOf = (charger: Charger) =>
  charger.current === 'DC' ? +(charger.powerKw * 0.75).toFixed(1) : +(Math.min(charger.powerKw, 7.4) * 0.46).toFixed(1);
// seconds until full: DC knows the starting %; AC assumes the car arrived at about 40%
const secondsToFull = (charger: Charger, startSoc: number | null) =>
  Math.round(((BATTERY_KWH * (1 - (charger.current === 'DC' && startSoc != null ? startSoc : 40) / 100)) / ratedKwOf(charger)) * 3600);

/**
 * Live numbers for a running session at time `now`. Charging stops by itself at the time
 * limit or when the battery is full, so a session left running doesn't keep adding cost.
 */
export function sessionReadout(s: LiveSession, now = Date.now()) {
  const { station, charger } = sessionParts(s);
  const dc = charger.current === 'DC';
  const ratedKw = ratedKwOf(charger);
  const fullAfter = secondsToFull(charger, s.startSoc);
  const limit = s.limitMins ? s.limitMins * 60 : null;
  const stopAfter = limit != null ? Math.min(limit, fullAfter) : fullAfter;
  const elapsed = Math.max(0, Math.floor((now - s.startedAt) / 1000));
  const full = elapsed >= stopAfter; // finished, by time limit or full battery
  const doneBy: 'time' | 'full' | null = full ? (limit != null && limit < fullAfter ? 'time' : 'full') : null;
  const seconds = Math.min(elapsed, stopAfter);
  const energyKwh = (ratedKw * seconds) / 3600;
  const costINR = energyKwh * station.pricePerKwh;
  const soc = dc && s.startSoc != null ? Math.min(100, s.startSoc + (energyKwh / BATTERY_KWH) * 100) : null;
  return { dc, powerKw: full ? 0 : ratedKw, seconds, energyKwh, costINR, soc, full, doneBy, limitMins: s.limitMins ?? null, endsAt: s.startedAt + stopAfter * 1000 };
}

export const formatDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s).padStart(2, '0')}s`;
};

// ---- actions ----
export function startSession(stationId: string, chargerId: string, connectorId: string, limitMins: number | null = null) {
  const station = STATIONS.find((x) => x.id === stationId);
  const charger = station?.chargers.find((c) => c.id === chargerId);
  const now = Date.now();
  const used = state.reservations.find(
    (r) => r.stationId === stationId && r.chargerId === chargerId && r.connectorId === connectorId && ['upcoming', 'held'].includes(reservationState(r, now)),
  );
  if (used) endReminders(used);
  set({
    reservations: state.reservations.map((r) => (r === used ? { ...r, status: 'used' as const } : r)),
    inbox: used ? dropPending(state.inbox, used.id) : state.inbox,
    session: {
      stationId,
      chargerId,
      connectorId,
      startedAt: Date.now(),
      startSoc: charger?.current === 'DC' ? DEMO_START_SOC : null,
      limitMins,
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
    reason: r.doneBy === 'time' ? 'Reached your time limit' : r.doneBy === 'full' ? 'Battery full' : 'Stopped from the app',
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

// ---- reservations ----
export function reservationState(r: Reservation, now = Date.now()): ReservationState {
  if (r.status !== 'booked') return r.status;
  if (now < r.startAt) return 'upcoming';
  return now < releaseAt(r) ? 'held' : 'expired';
}
/** End of the hold itself; the grace period runs after this. */
export const holdEndsAt = (r: Reservation) => r.startAt + r.holdMins * 60000;
/** When the connector goes back to everyone if the driver hasn't plugged in. */
export const releaseAt = (r: Reservation) => holdEndsAt(r) + GRACE_MINS * 60000;
export const inGrace = (r: Reservation, now = Date.now()) => r.status === 'booked' && now >= holdEndsAt(r) && now < releaseAt(r);

/** Reservations missed in the last week; enough of them pauses booking for a while. */
export function bookingPausedUntil(list: Reservation[], now = Date.now()): number | null {
  const missed = list.filter((r) => reservationState(r, now) === 'expired' && now - releaseAt(r) < 7 * 86400000);
  if (missed.length < NO_SHOW_LIMIT) return null;
  const until = Math.max(...missed.map(releaseAt)) + NO_SHOW_PAUSE_HOURS * 3600000;
  return now < until ? until : null;
}
/** The one booking that's still ahead or being held, if any. */
export const liveReservation = (list: Reservation[], now = Date.now()) =>
  list.find((r) => ['upcoming', 'held'].includes(reservationState(r, now))) ?? null;

const shortDate = (t: number) =>
  new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

/** Cancelling within this long after booking (or this long before a slot) refunds the fee, once there is one. */
export const FREE_CANCEL_MINS = 5;
export const LATER_FREE_CANCEL_MINS = 15;
export const canRefund = (r: Reservation, now = Date.now()) =>
  r.kind === 'later' ? now < r.startAt - LATER_FREE_CANCEL_MINS * 60000 : now < (r.bookedAt ?? r.startAt) + FREE_CANCEL_MINS * 60000;

const timeLabel = (t: number) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const dayTimeLabel = (t: number) => {
  const d = new Date(t).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const day = d === today ? 'Today' : d === today + 86400000 ? 'Tomorrow' : new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${timeLabel(t)}`;
};

/**
 * Books a connector. Without `startAt` it's held from now for `holdMins`; with a future
 * `startAt` it's a slot held SLOT_HOLD_MINS from then. Either way GRACE_MINS follow.
 * Returns why it failed, or null.
 */
export function reserve(r: { stationId: string; chargerId: string; connectorId: string; holdMins: number; startAt?: number }): 'balance' | 'exists' | 'daily' | 'paused' | null {
  const now = Date.now();
  if (liveReservation(state.reservations, now)) return 'exists';
  if (bookingPausedUntil(state.reservations, now)) return 'paused';
  const today = new Date(now).setHours(0, 0, 0, 0);
  if (state.reservations.filter((x) => (x.bookedAt ?? x.startAt) >= today).length >= MAX_RESERVATIONS_PER_DAY) return 'daily';
  if (state.walletBalance < RESERVATION_FEE) return 'balance';
  const station = STATIONS.find((s) => s.id === r.stationId);
  const later = r.startAt != null && r.startAt > now;
  const res: Reservation = {
    id: `rs${now}`,
    stationId: r.stationId,
    chargerId: r.chargerId,
    connectorId: r.connectorId,
    startAt: later ? (r.startAt as number) : now,
    holdMins: later ? SLOT_HOLD_MINS : r.holdMins,
    feeINR: RESERVATION_FEE,
    status: 'booked',
    kind: later ? 'later' : 'now',
    bookedAt: now,
  };
  const name = station?.name ?? 'the station';
  // what we tell the driver, and when
  const notes: Omit<InboxItem, 'id' | 'reservationId'>[] = later
    ? [
        { title: 'Slot booked', body: `${name}, ${dayTimeLabel(res.startAt)}. We'll remind you 10 minutes before.`, at: now },
        { title: 'Your slot starts in 10 minutes', body: `Head to ${name}. Your connector is held until ${timeLabel(holdEndsAt(res))}.`, at: res.startAt - 10 * 60000 },
        { title: 'Plug in within 10 minutes', body: `Your hold at ${name} has ended. After ${timeLabel(releaseAt(res))} the connector is released.`, at: holdEndsAt(res) },
      ]
    : [
        { title: 'Connector reserved', body: `Held for you at ${name} until ${timeLabel(holdEndsAt(res))}, then ${GRACE_MINS} more minutes to plug in.`, at: now },
        { title: 'Plug in within 10 minutes', body: `Your hold at ${name} has ended. After ${timeLabel(releaseAt(res))} the connector is released.`, at: holdEndsAt(res) },
      ];
  set({
    reservations: [res, ...state.reservations],
    inbox: [...notes.map((n, i) => ({ ...n, id: `${res.id}-${i}`, reservationId: res.id })), ...state.inbox],
    ...(RESERVATION_FEE > 0
      ? {
          walletBalance: +(state.walletBalance - RESERVATION_FEE).toFixed(2),
          txns: [{ id: `w${now}`, kind: 'charge' as const, title: `Reservation · ${name}`, dateLabel: shortDate(now), amount: -RESERVATION_FEE }, ...state.txns],
        }
      : {}),
  });
  // phone notifications, scheduled in the background
  void Promise.all(notes.map((n) => remind(n.title, n.body, n.at))).then((ids) => {
    const reminderIds = ids.filter((x): x is string => !!x);
    set({ reservations: state.reservations.map((x) => (x.id === res.id ? { ...x, reminderIds } : x)) });
  });
  return null;
}

/** Stops reminders that haven't fired yet. */
function endReminders(r: Reservation) {
  void cancelReminders(r.reminderIds);
}
/** Removes a reservation's inbox items that haven't appeared yet. */
const dropPending = (inbox: InboxItem[], reservationId: string, now = Date.now()) => inbox.filter((n) => n.reservationId !== reservationId || n.at <= now);

/** Cancels a booking; any fee comes back inside the free-cancel window. */
export function cancelReservation(id: string) {
  const r = state.reservations.find((x) => x.id === id);
  if (!r) return;
  const refund = r.feeINR > 0 && canRefund(r);
  endReminders(r);
  set({
    reservations: state.reservations.map((x) => (x.id === id ? { ...x, status: 'cancelled' as const } : x)),
    inbox: dropPending(state.inbox, id),
    ...(refund
      ? {
          walletBalance: +(state.walletBalance + r.feeINR).toFixed(2),
          txns: [{ id: `w${Date.now()}`, kind: 'refund' as const, title: 'Reservation refund', dateLabel: shortDate(Date.now()), amount: r.feeINR }, ...state.txns],
        }
      : {}),
  });
}

// ---- RFID cards ----
/** "04A13F9C2B7E81" → "04A1 3F9C 2B7E 81" */
export const formatUid = (uid: string) => uid.match(/.{1,4}/g)?.join(' ') ?? '';
const today = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function addRfidCard(c: { uid: string; name: string; vehicleId?: string }) {
  set({ rfidCards: [...state.rfidCards, { ...c, id: `rf${Date.now()}`, status: 'active', addedLabel: `Added ${today()}` }] });
}
export function setRfidStatus(id: string, status: 'active' | 'blocked') {
  set({ rfidCards: state.rfidCards.map((c) => (c.id === id ? { ...c, status } : c)) });
}
export function removeRfidCard(id: string) {
  set({ rfidCards: state.rfidCards.filter((c) => c.id !== id) });
}
/** Orders a new card, paid from the wallet. Returns false if the balance is too low. */
export function orderRfidCard(): boolean {
  if (state.walletBalance < RFID_CARD_PRICE) return false;
  set({
    rfidCards: [
      ...state.rfidCards,
      { id: `rf${Date.now()}`, uid: '', name: 'New EVIT card', status: 'ordered', vehicleId: state.vehicles[0]?.id, addedLabel: `Ordered ${today()}` },
    ],
    walletBalance: +(state.walletBalance - RFID_CARD_PRICE).toFixed(2),
    txns: [{ id: `w${Date.now()}`, kind: 'plan', title: 'EVIT RFID card', dateLabel: shortDate(Date.now()), amount: -RFID_CARD_PRICE }, ...state.txns],
  });
  return true;
}
