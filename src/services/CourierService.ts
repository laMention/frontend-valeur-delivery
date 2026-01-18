import { apiClient } from './apiClient';

export interface Courier {
  uuid: string;
  id: string;
  user_uuid: string;
  vehicle_type: 'moto' | 'voiture' | 'velo';
  is_active: boolean;
  status?: string;
  current_location?: {
    lat: number;
    lng: number;
  };
  distance_km?: number | null;
  user?: {
    uuid: string;
    name: string;
    email: string;
    phone?: string;
  };
  zones?: Array<{
    uuid: string;
    name: string;
    is_primary: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateCourierData {
  user_uuid: string;
  vehicle_type: 'moto' | 'voiture' | 'velo';
  zone_ids?: string[];
  primary_zone_id?: string;
}

export interface UpdateCourierData {
  vehicle_type?: 'moto' | 'voiture' | 'velo';
  is_active?: boolean;
  zone_ids?: string[];
  primary_zone_id?: string;
}

export interface UpdateLocationData {
  lat: number;
  lng: number;
}

class CourierService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    is_active?: boolean;
    vehicle_type?: 'moto' | 'voiture' | 'velo';
  }): Promise<{ data: Courier[]; meta: any }> {
    const response = await apiClient.get<{ data: Courier[]; meta: any }>('/couriers', { params });
    return response.data;
  }

  async getAvailableForZone(zoneUuid?: string, vehicleType?: 'moto' | 'voiture' | 'velo'): Promise<{ data: Courier[] }> {
    const response = await apiClient.get<{ data: Courier[] }>('/available-for-zone/couriers', {
      params: { zone_uuid: zoneUuid, vehicle_type: vehicleType }
    });
    return response.data;
  }

  async getById(uuid: string): Promise<{ data: Courier }> {
    const response = await apiClient.get<{ data: Courier }>(`/couriers/${uuid}`);
    return response.data;
  }

  async create(data: CreateCourierData): Promise<{ data: Courier }> {
    const response = await apiClient.post<{ data: Courier }>('/couriers', data);
    return response.data;
  }

  async update(uuid: string, data: UpdateCourierData): Promise<{ data: Courier }> {
    const response = await apiClient.put<{ data: Courier }>(`/couriers/${uuid}`, data);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/couriers/${uuid}`);
  }

  async updateLocation(uuid: string, location: UpdateLocationData): Promise<{ data: Courier }> {
    const response = await apiClient.post<{ data: Courier }>(`/couriers/${uuid}/location`, location);
    return response.data;
  }

  async getActiveCouriers(): Promise<{ data: Courier[] }> {
    const response = await apiClient.get<{ data: Courier[] }>('/active/couriers');
    return response.data;
  }

  async getWithAcceptedOrders(): Promise<{ data: Courier[] }> {
    const response = await apiClient.get<{ data: Courier[] }>('/with-accepted-orders/couriers');
    return response.data;
  }

  async attachZones(uuid: string, zoneIds: string[], primaryZoneId?: string): Promise<{ data: Courier }> {
    const response = await apiClient.post<{ data: Courier }>(`/couriers/${uuid}/zones`, {
      zone_ids: zoneIds,
      primary_zone_id: primaryZoneId,
    });
    return response.data;
  }

  async getZones(uuid: string): Promise<{ data: any[] }> {
    const response = await apiClient.get<{ data: any[] }>(`/couriers/${uuid}/zones`);
    return response.data;
  }
}

export const courierService = new CourierService();

