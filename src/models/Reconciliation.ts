export interface ReconciliationScan {
  uuid: string;
  order_uuid: string;
  user_uuid: string;
  scan_type: ReconciliationScanType;
  location?: {
    lat: number;
    lng: number;
  };
  scanned_at: string;
  created_at: string;
  updated_at: string;
}

export type ReconciliationScanType = 'delivery' | 'return' | 'stocked' | 'not_found';

export interface ReconciliationStats {
  assigned: number;
  delivered: number;
  returned: number;
  stocked: number;
  not_found: number;
  discrepancies: number;
}

