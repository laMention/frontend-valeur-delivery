import { apiClient } from './apiClient';
import type { PricingRule } from '../models/PricingRule';

export interface StorePricingRuleData {
  vehicle_type: 'moto' | 'voiture';
  min_distance_km: number;
  max_distance_km?: number | null;
  base_price: number;
  express_price?: number | null;
  zone_uuid?: string | null;
  is_active?: boolean;
  priority?: number;
}

export interface UpdatePricingRuleData extends Partial<StorePricingRuleData> {}

class PricingRuleService {
  async getAll(params?: {
    vehicle_type?: 'moto' | 'voiture';
    zone_uuid?: string;
    is_active?: boolean;
    priority?: number;
    priority_min?: number;
    priority_max?: number;
    page?: number;
    per_page?: number;
  }): Promise<{ data: PricingRule[]; meta: any }> {
    const response = await apiClient.get<{ data: PricingRule[]; meta: any }>('/pricing-rules', { params });
    return response.data;
  }

  async getByUuid(uuid: string): Promise<{ data: PricingRule }> {
    const response = await apiClient.get<{ data: PricingRule }>(`/pricing-rules/${uuid}`);
    return response.data;
  }

  async create(data: StorePricingRuleData): Promise<{ data: PricingRule }> {
    const response = await apiClient.post<{ data: PricingRule }>('/pricing-rules', data);
    return response.data;
  }

  async update(uuid: string, data: UpdatePricingRuleData): Promise<{ data: PricingRule }> {
    const response = await apiClient.put<{ data: PricingRule }>(`/pricing-rules/${uuid}`, data);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/pricing-rules/${uuid}`);
  }
}

export const pricingRuleService = new PricingRuleService();

