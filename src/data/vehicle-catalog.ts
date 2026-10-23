/**
 * The cars a driver can add: exactly the 20 in EVIT_EV_Vehicles_20_FINAL_TRANSPARENT.zip,
 * each with its photo. Connectors come from the 121-model connector list (vehicles.ts);
 * Kia EV9 and Volvo EX30 aren't in that list, so they use the Type-2 + CCS combo every
 * other car here has.
 */
import type { ConnectorKey } from '@/data/connectors';
import { vehiclePhoto } from '@/data/vehicle-images';
import { VEHICLE_MODELS } from '@/data/vehicles';

export interface CatalogCar {
  make: string;
  /** Name shown to drivers. */
  model: string;
  connectors: ConnectorKey[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photos: any[];
}

/* eslint-disable @typescript-eslint/no-require-imports */
// [make, display name, model name in the connector list (or null), photo override]
const ZIP_CARS: [string, string, string | null, unknown?][] = [
  ['Tata Motors', 'Nexon EV', 'Nexon EV'],
  ['Tata Motors', 'Punch EV', 'Punch EV'],
  ['Tata Motors', 'Tiago EV', 'TATA Tiago'],
  ['Tata Motors', 'Curvv EV', 'TATA Curvv.ev'],
  ['Tata Motors', 'Harrier EV', 'Tata Harrier'],
  ['MG Motor', 'Windsor EV', 'MG Windsor EV'],
  ['MG Motor', 'ZS EV', 'MG ZSEV'],
  ['Mahindra', 'XUV400 EV', 'XUV400EL'],
  ['Mahindra', 'BE 6', 'Mahindra BE 6e'],
  ['Mahindra', 'XEV 9e', 'Mahindra XEV 9e'],
  ['Hyundai', 'Creta Electric', 'Hyundai Creta'],
  ['Hyundai', 'IONIQ 5', 'IONIQ 5'],
  ['Kia', 'EV6', 'KIA EV6'],
  ['Kia', 'EV9', null, require('@/assets/images/vehicles/kia-ev9.png')],
  ['BYD', 'Atto 3', 'Atto 3'],
  ['BYD', 'Seal', 'BYD Seal'],
  ['BYD', 'e6', 'E6'],
  ['BMW', 'iX1', 'iX1'],
  ['Mercedes-Benz', 'EQA', 'EQA'],
  ['Volvo', 'EX30', null, require('@/assets/images/vehicles/volvo-ex30.png')],
];
/* eslint-enable @typescript-eslint/no-require-imports */

const DEFAULT_CONNECTORS: ConnectorKey[] = ['type2', 'ccs'];

export const VEHICLE_CATALOG: CatalogCar[] = ZIP_CARS.map(([make, model, listName, photo]) => ({
  make,
  model,
  connectors: (listName && VEHICLE_MODELS.find((v) => v.model === listName)?.connectors) || DEFAULT_CONNECTORS,
  photos: [photo ?? vehiclePhoto(listName)].filter(Boolean),
}));

/** Brands in the catalogue, most models first. */
export const CATALOG_MAKES = [...new Set(VEHICLE_CATALOG.map((c) => c.make))].sort(
  (a, b) => VEHICLE_CATALOG.filter((c) => c.make === b).length - VEHICLE_CATALOG.filter((c) => c.make === a).length || a.localeCompare(b),
);
