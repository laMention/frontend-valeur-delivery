import { apiClient } from './apiClient';

export interface DeliveryAssignment {
  uuid: string;
  order_uuid: string;
  courier_uuid: string;
  assigned_at: string;
  accepted_at?: string;
  completed_at?: string;
  assignment_status: 'assigned' | 'accepted' | 'completed' | 'canceled';
  order?: any;
  courier?: any;
  created_at: string;
  updated_at: string;
}

export interface AssignOrderData {
  order_uuid: string;
  courier_uuid: string;
}

export interface ReassignOrderData {
  assignment_uuid: string;
  new_courier_uuid: string;
}

class AssignmentService {
  async assign(data: AssignOrderData): Promise<{ data: DeliveryAssignment }> {
    const response = await apiClient.post<{ data: DeliveryAssignment }>('/assignments', data);
    return response.data;
  }

  async reassign(data: ReassignOrderData): Promise<{ data: DeliveryAssignment }> {
    const response = await apiClient.post<{ data: DeliveryAssignment }>(`/assignments/${data.assignment_uuid}/reassign`, {
      courier_uuid: data.new_courier_uuid,
    });
    return response.data;
  }

  async accept(assignmentUuid: string): Promise<{ data: DeliveryAssignment }> {
    const response = await apiClient.post<{ data: DeliveryAssignment }>(`/assignments/${assignmentUuid}/accept`);
    return response.data;
  }

  async cancel(assignmentUuid: string): Promise<{ data: DeliveryAssignment }> {
    const response = await apiClient.post<{ data: DeliveryAssignment }>(`/assignments/${assignmentUuid}/cancel`);
    return response.data;
  }

  async getByCourier(courierUuid: string, status?: string): Promise<{ data: DeliveryAssignment[] }> {
    const response = await apiClient.get<{ data: DeliveryAssignment[] }>(`/assignments/courier/${courierUuid}`, {
      params: { status },
    });
    return response.data;
  }

  async getByOrder(orderUuid: string): Promise<{ data: DeliveryAssignment[] }> {
    const response = await apiClient.get<{ data: DeliveryAssignment[] }>(`/assignments/order/${orderUuid}`);
    return response.data;
  }

  async suggestCouriers(orderUuid: string, maxDistanceKm?: number): Promise<{ data: any[] }> {
    const response = await apiClient.get<{ data: any[] }>(`/assignments/order/${orderUuid}/suggest-couriers`, {
      params: maxDistanceKm ? { max_distance_km: maxDistanceKm } : {},
    });
    return response.data;
  }

  async getAssignedOrders(params?: { courier_uuid?: string; per_page?: number }): Promise<{ data: DeliveryAssignment[]; meta?: any }> {
    const response = await apiClient.get<{ data: DeliveryAssignment[]; meta?: any }>('/assignments/assigned-orders', {
      params,
    });
    return response.data;
  }

  async getAssignmentCountsByCourier(): Promise<{ data: Record<string, number> }> {
    const response = await apiClient.get<{ data: Record<string, number> }>('/assignments/counts-by-courier');
    return response.data;
  }
}

export const assignmentService = new AssignmentService();

