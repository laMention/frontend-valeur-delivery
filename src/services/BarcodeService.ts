import { apiClient } from './apiClient';

export interface BarcodeScan {
  uuid: string;
  order_uuid: string;
  user_uuid: string;
  scan_type: 'pickup' | 'warehouse_in' | 'warehouse_out' | 'delivery' | 'return';
  location?: {
    lat: number;
    lng: number;
  };
  scanned_at: string;
  created_at: string;
  updated_at: string;
}

export interface ScanBarcodeData {
  barcode_value: string;
  scan_type: BarcodeScan['scan_type'];
  location?: {
    lat: number;
    lng: number;
  };
}

class BarcodeService {
  async scan(data: ScanBarcodeData): Promise<{ data: { order: any; scan: BarcodeScan } }> {
    const response = await apiClient.post<{ data: { order: any; scan: BarcodeScan } }>('/barcode/scan', data);
    return response.data;
  }

  async generate(orderUuid: string, format: 'code128' | 'qrcode' = 'code128'): Promise<{ data: { barcode_value: string; barcode_image: string; format: string } }> {
    const response = await apiClient.post<{ data: { barcode_value: string; barcode_image: string; format: string } }>(`/barcode/generate/${orderUuid}`, {}, {
      params: { format }
    });
    return response.data;
  }

  async getScans(orderUuid: string): Promise<{ data: BarcodeScan[] }> {
    const response = await apiClient.get<{ data: BarcodeScan[] }>(`/barcode/scans/${orderUuid}`);
    return response.data;
  }
}

export const barcodeService = new BarcodeService();

