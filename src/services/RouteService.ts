import { apiClient } from './apiClient';

export interface RoutePoint {
  order_uuid: string;
  address: string;
  lat: number;
  lng: number;
  sequence: number;
}

export interface OptimizedRoute {
  uuid: string;
  courier_uuid: string;
  route_points: RoutePoint[];
  total_distance: number;
  estimated_time: number;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface OptimizeRouteData {
  courier_uuid: string;
  order_uuids: string[];
}

class RouteService {
  async optimize(data: OptimizeRouteData): Promise<{ data: OptimizedRoute }> {
    const response = await apiClient.post<{ data: OptimizedRoute }>('/routes/optimize', data);
    return response.data;
  }

  async getByCourier(courierUuid: string): Promise<{ data: OptimizedRoute | null }> {
    const response = await apiClient.get<{ data: OptimizedRoute | null }>(`/routes/courier/${courierUuid}`);
    return response.data;
  }

  async recalculate(routeUuid: string, orderUuids: string[]): Promise<{ data: OptimizedRoute }> {
    const response = await apiClient.post<{ data: OptimizedRoute }>(`/routes/${routeUuid}/recalculate`, {
      order_uuids: orderUuids,
    });
    return response.data;
  }
}

export const routeService = new RouteService();

