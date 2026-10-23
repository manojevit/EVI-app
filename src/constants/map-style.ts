/** Light, brand-tinted Google map style shared by the Map tab and onboarding. */
export const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#eef3ec' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5e6f64' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#eef3ec' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d6f0db' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e4ebe1' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfe3cf' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
];

/** Camera that frames every EVIT station (Delhi NCR) — used by onboarding and the embedded maps. */
export const STATIONS_CAMERA = { latitude: 28.605, longitude: 77.12, zoom: 10 };

/** Google's keyless map embed for a camera (used where the native map SDK isn't available). */
export const embedUrl = (c = STATIONS_CAMERA) =>
  `https://maps.google.com/maps?ll=${c.latitude},${c.longitude}&z=${c.zoom}&output=embed`;

/**
 * Pixel offset of a coordinate from the map centre, using Google's Web Mercator
 * scale (the world is 256·2^zoom points wide) — identical on the native SDK and
 * the web embed, so overlay pins land on the right streets.
 */
export function projectFromCenter(
  latitude: number,
  longitude: number,
  center = STATIONS_CAMERA,
) {
  const world = 256 * 2 ** center.zoom;
  const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return {
    x: ((longitude - center.longitude) / 360) * world,
    y: ((mercY(center.latitude) - mercY(latitude)) / (2 * Math.PI)) * world,
  };
}
