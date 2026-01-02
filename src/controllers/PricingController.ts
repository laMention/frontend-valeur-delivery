import { pricingService, type CalculatePricingData } from '../services/PricingService';

class PricingController {
  async calculate(data: CalculatePricingData) {
    try {
      const response = await pricingService.calculate(data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors du calcul du prix' };
    }
  }

  async getByOrder(orderUuid: string) {
    try {
      const response = await pricingService.getByOrder(orderUuid);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la récupération du prix' };
    }
  }

  async getAll(params?: { page?: number; per_page?: number }) {
    try {
      const response = await pricingService.getAll(params);
      return { success: true, data: response.data, meta: response.meta };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur' };
    }
  }
}

export const pricingController = new PricingController();

