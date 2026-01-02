export interface BarcodeScan {
  uuid: string;
  order_uuid: string;
  user_uuid: string;
  scan_type: ScanType;
  location?: {
    lat: number;
    lng: number;
  };
  scanned_at: string;
  created_at: string;
  updated_at: string;
}

export type ScanType = 'pickup' | 'warehouse_in' | 'warehouse_out' | 'delivery' | 'return';

