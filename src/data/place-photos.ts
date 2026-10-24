/* eslint-disable @typescript-eslint/no-require-imports */
// Free-to-use photos for nearby places (sources in assets/images/places/SOURCES.md).
export const PLACE_PHOTOS: Record<string, number> = {
  'cafe-1': require('@/assets/images/places/cafe-1.jpg'),
  'cafe-2': require('@/assets/images/places/cafe-2.jpg'),
  'cafe-3': require('@/assets/images/places/cafe-3.jpg'),
  'food-1': require('@/assets/images/places/food-1.jpg'),
  'food-2': require('@/assets/images/places/food-2.jpg'),
  'food-3': require('@/assets/images/places/food-3.jpg'),
  'mall-1': require('@/assets/images/places/mall-1.jpg'),
  'pharmacy-1': require('@/assets/images/places/pharmacy-1.jpg'),
  'atm-1': require('@/assets/images/places/atm-1.jpg'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

/** Opening state right now: status ("Open", "Closed", "Open 24 hours") plus a short detail. */
export function openLabel(hours: [number, number] | undefined, now = new Date()) {
  if (!hours) return { open: true, status: 'Open 24 hours', detail: '' };
  const [from, to] = hours;
  const h = now.getHours() + now.getMinutes() / 60;
  const open = to > from ? h >= from && h < to : h >= from || h < to;
  const fmt = (x: number) => `${x % 12 || 12} ${x < 12 || x === 24 ? 'am' : 'pm'}`;
  return open ? { open, status: 'Open', detail: `till ${fmt(to)}` } : { open, status: 'Closed', detail: `opens ${fmt(from)}` };
}

/** 44468 → "44.5k" so review counts fit on narrow cards. */
export const compactCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
