/**
 * The 7 connector types used across India (from EV_Connector_Data).
 * Icons are the official line drawings, tinted at render time.
 */

export type ConnectorKey = 'type2' | 'ccs' | 'chademo' | 'gbt' | 'dc001' | 'bevc' | 'iec';

export interface ConnectorType {
  key: ConnectorKey;
  label: string;
  current: 'AC' | 'DC';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
}

/* eslint-disable @typescript-eslint/no-require-imports */
export const CONNECTORS: Record<ConnectorKey, ConnectorType> = {
  type2: { key: 'type2', label: 'Type-2 (AC)', current: 'AC', icon: require('@/assets/images/connectors/type2.png') },
  ccs: { key: 'ccs', label: 'CCS (DC)', current: 'DC', icon: require('@/assets/images/connectors/ccs.png') },
  chademo: { key: 'chademo', label: 'CHAdeMO (DC)', current: 'DC', icon: require('@/assets/images/connectors/chademo.png') },
  gbt: { key: 'gbt', label: 'GB/T', current: 'DC', icon: require('@/assets/images/connectors/gbt.png') },
  dc001: { key: 'dc001', label: 'DC-001', current: 'DC', icon: require('@/assets/images/connectors/dc001.png') },
  bevc: { key: 'bevc', label: 'BEVC-AC001', current: 'AC', icon: require('@/assets/images/connectors/bevc.png') },
  iec: { key: 'iec', label: 'IEC AC', current: 'AC', icon: require('@/assets/images/connectors/iec.png') },
};
/* eslint-enable @typescript-eslint/no-require-imports */

export const CONNECTOR_KEYS = Object.keys(CONNECTORS) as ConnectorKey[];
