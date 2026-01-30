import { apiClient } from './apiClient';
import type { Courier } from './CourierService';

export interface PartnerTrackingCouriersResponse {
  data: Courier[];
  assignment_counts: Record<string, number>;
}

class PartnerTrackingService {
  async getCouriers(): Promise<PartnerTrackingCouriersResponse> {
    const response = await apiClient.get<PartnerTrackingCouriersResponse>('/partner/tracking/couriers');
    return response.data;
  }

  async logRouteView(): Promise<void> {
    await apiClient.post('/partner/tracking/log-route-view');
  }
}

export const partnerTrackingService = new PartnerTrackingService();
