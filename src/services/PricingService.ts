import { apiClient } from './apiClient';

export interface Pricing {
  uuid: string;
  order_uuid: string;
  distance_km: number;
  vehicle_type: 'moto' | 'voiture';
  price: number;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface CalculatePricingData {
  delivery_address: string;
  zone_uuid: string;
  vehicle_type?: 'moto' | 'voiture';
  weight?: number;
  is_express?: boolean;
}

export interface PricingCalculation {
  distance_km: number;
  vehicle_type: 'moto' | 'voiture';
  price: number;
  estimated_time: number;
}

class PricingService {
  async calculate(data: CalculatePricingData): Promise<{ data: PricingCalculation }> {
    const response = await apiClient.post<{ data: PricingCalculation }>('/pricing/calculate', data);
    return response.data;
  }

  async calculateAndSave(orderUuid: string, options?: { is_express?: boolean; vehicle_type?: 'moto' | 'voiture' }): Promise<{ data: Pricing }> {
    const response = await apiClient.post<{ data: Pricing }>(`/pricing/order/${orderUuid}/calculate`, options || {});
    return response.data;
  }

  async getByOrder(orderUuid: string): Promise<{ data: Pricing }> {
    const response = await apiClient.get<{ data: Pricing }>(`/pricing/order/${orderUuid}`);
    return response.data;
  }

  async getAll(params?: { page?: number; per_page?: number }): Promise<{ data: Pricing[]; meta: any }> {
    const response = await apiClient.get<{ data: Pricing[]; meta: any }>('/pricing', { params });
    return response.data;
  }
}

export const pricingService = new PricingService();

