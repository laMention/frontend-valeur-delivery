import { apiClient } from './apiClient';

export interface ReportStats {
  total_orders: number;
  delivered_orders: number;
  pending_orders: number;
  returned_orders: number;
  average_delivery_time: number;
  total_revenue: number;
}

export interface PartnerPerformance {
  partner_uuid: string;
  partner_name: string;
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  success_rate: number;
}

export interface CourierPerformance {
  courier_uuid: string;
  courier_name: string;
  total_deliveries: number;
  completed_deliveries: number;
  average_delivery_time: number;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  partner_id?: string;
  courier_id?: string;
  zone_uuid?: string;
  status?: string;
}

class ReportingService {
  async getStats(filters?: ReportFilters): Promise<{ data: ReportStats }> {
    const response = await apiClient.get<{ data: ReportStats }>('/reporting/stats', { params: filters });
    return response.data;
  }

  async getPartnerPerformance(filters?: ReportFilters): Promise<{ data: PartnerPerformance[] }> {
    const response = await apiClient.get<{ data: PartnerPerformance[] }>('/reporting/partners', { params: filters });
    return response.data;
  }

  async getCourierPerformance(filters?: ReportFilters): Promise<{ data: CourierPerformance[] }> {
    const response = await apiClient.get<{ data: CourierPerformance[] }>('/reporting/couriers', { params: filters });
    return response.data;
  }

  async exportReport(format: 'csv' | 'pdf' | 'excel', filters?: ReportFilters): Promise<Blob> {
    const response = await apiClient.get('/reporting/export', {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const reportingService = new ReportingService();

