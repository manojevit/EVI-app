import type { Reservation } from '@/data/app-store';
import { STATIONS } from '@/data/mock';

export const MIN = 60000;

/** "6:30 pm" */
export const clock = (t: number) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

/** "Today", "Tomorrow" or "21 Oct" */
export const dayLabel = (t: number, now = Date.now()) => {
  const d = new Date(t).setHours(0, 0, 0, 0);
  const today = new Date(now).setHours(0, 0, 0, 0);
  if (d === today) return 'Today';
  if (d === today + 86400000) return 'Tomorrow';
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** "25 min" or "1 h 05 min" */
export const inWords = (ms: number) => {
  const m = Math.max(1, Math.ceil(ms / MIN));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
};

/** Where a booking points: station, charger and connector (null if the station data changed). */
export function reservationParts(r: Pick<Reservation, 'stationId' | 'chargerId' | 'connectorId'>) {
  const station = STATIONS.find((s) => s.id === r.stationId);
  const charger = station?.chargers.find((c) => c.id === r.chargerId);
  const connector = charger?.connectors.find((c) => c.id === r.connectorId);
  return station && charger && connector ? { station, charger, connector } : null;
}
