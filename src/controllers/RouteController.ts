import { routeService, type OptimizeRouteData } from '../services/RouteService';

class RouteController {
  async optimize(data: OptimizeRouteData) {
    try {
      const response = await routeService.optimize(data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de l\'optimisation' };
    }
  }

  async getByCourier(courierUuid: string) {
    try {
      const response = await routeService.getByCourier(courierUuid);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur' };
    }
  }

  async recalculate(routeUuid: string, orderUuids: string[]) {
    try {
      const response = await routeService.recalculate(routeUuid, orderUuids);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors du recalcul' };
    }
  }
}

export const routeController = new RouteController();

