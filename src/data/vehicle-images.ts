/**
 * Car photos (from EVIT_EV_Vehicles_20_FINAL_TRANSPARENT), keyed by the model name used in
 * vehicles.ts. Variants of the same car share a photo. Models without a photo fall back to
 * the vehicle-type icon. (Kia EV9 and Volvo EX30 photos exist but aren't in the model list.)
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const NEXON = require('@/assets/images/vehicles/tata-motors-nexon-ev.png');
const WINDSOR = require('@/assets/images/vehicles/mg-motor-windsor-ev.png');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PHOTOS: Record<string, any> = {
  // Tata Motors
  'Nexon EV': NEXON,
  'Nexon Prime EV': NEXON,
  'Tata Nexon Empowered 45': NEXON,
  'Tata Nexon Empowered LR': NEXON,
  'Tata Nexon EV creative Plus MR': NEXON,
  'Punch EV': require('@/assets/images/vehicles/tata-motors-punch-ev.png'),
  'TATA Tiago': require('@/assets/images/vehicles/tata-motors-tiago-ev.png'),
  'TATA Curvv.ev': require('@/assets/images/vehicles/tata-motors-curvv-ev.png'),
  'Tata Harrier': require('@/assets/images/vehicles/tata-motors-harrier-ev.png'),
  // MG
  'MG Windsor EV': WINDSOR,
  'Windsor EV Pro': WINDSOR,
  'Windsor Essense Pro': WINDSOR,
  'MG ZSEV': require('@/assets/images/vehicles/mg-motor-zs-ev.png'),
  // Mahindra
  'XUV400EL': require('@/assets/images/vehicles/mahindra-xuv400-ev.png'),
  'Mahindra BE 6e': require('@/assets/images/vehicles/mahindra-be-6.png'),
  'Mahindra XEV 9e': require('@/assets/images/vehicles/mahindra-xev-9e.png'),
  // Hyundai / Kia
  'Hyundai Creta': require('@/assets/images/vehicles/hyundai-creta-electric.png'),
  'IONIQ 5': require('@/assets/images/vehicles/hyundai-ioniq-5.png'),
  'KIA EV6': require('@/assets/images/vehicles/kia-ev6.png'),
  // BYD
  'Atto 3': require('@/assets/images/vehicles/byd-atto-3.png'),
  'BYD Seal': require('@/assets/images/vehicles/byd-seal.png'),
  'E6': require('@/assets/images/vehicles/byd-e6.png'),
  // Luxury
  'iX1': require('@/assets/images/vehicles/bmw-ix1.png'),
  'EQA': require('@/assets/images/vehicles/mercedes-benz-eqa.png'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

// Extra looks (colours / angles) per model. Add more images here as the photo pack grows;
// Add a vehicle shows a picker whenever a model has more than one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EXTRA_PHOTOS: Record<string, any[]> = {};

export const vehiclePhoto = (model: string | null | undefined) => (model ? PHOTOS[model] ?? null : null);
export const hasVehiclePhoto = (model: string) => model in PHOTOS;
/** Every photo available for a model (first = default); empty if the pack has none yet. */
export const vehiclePhotos = (model: string | null | undefined) =>
  model && PHOTOS[model] ? [PHOTOS[model], ...(EXTRA_PHOTOS[model] ?? [])] : [];
