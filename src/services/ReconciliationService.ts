import { apiClient } from './apiClient';

export interface ReconciliationScan {
  uuid: string;
  order_uuid: string;
  user_uuid: string;
  scan_type: 'delivery' | 'return' | 'stocked' | 'not_found';
  location?: {
    lat: number;
    lng: number;
  };
  scanned_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationStats {
  assigned: number;
  delivered: number;
  returned: number;
  stocked: number;
  not_found: number;
  discrepancies: number;
}

export interface ScanReconciliationData {
  barcode_value: string;
  scan_type: 'delivery' | 'return' | 'stocked' | 'not_found';
  location?: {
    lat: number;
    lng: number;
  };
}

class ReconciliationService {
  async scan(data: ScanReconciliationData): Promise<{ data: { order: any; scan: ReconciliationScan } }> {
    const response = await apiClient.post<{ data: { order: any; scan: ReconciliationScan } }>('/reconciliation/scan', data);
    return response.data;
  }

  async getStats(date?: string): Promise<{ data: ReconciliationStats }> {
    const response = await apiClient.get<{ data: ReconciliationStats }>('/reconciliation/stats', {
      params: { date },
    });
    return response.data;
  }

  async getDiscrepancies(date?: string): Promise<{ data: any[] }> {
    const response = await apiClient.get<{ data: any[] }>('/reconciliation/discrepancies', {
      params: { date },
    });
    return response.data;
  }
}

export const reconciliationService = new ReconciliationService();

