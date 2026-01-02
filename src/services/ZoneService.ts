import { apiClient } from './apiClient';

export interface Zone {
  uuid: string;
  name: string;
  polygon: Array<{ lat: number; lng: number }>;
  created_at: string;
  updated_at: string;
}

export interface CreateZoneData {
  name: string;
  polygon: Array<{ lat: number; lng: number }>;
}

export interface UpdateZoneData {
  name?: string;
  polygon?: Array<{ lat: number; lng: number }>;
}

class ZoneService {
  async getAll(): Promise<{ data: Zone[] }> {
    const response = await apiClient.get<{ data: Zone[] }>('/zones');
    return response.data;
  }

  async getById(uuid: string): Promise<{ data: Zone }> {
    const response = await apiClient.get<{ data: Zone }>(`/zones/${uuid}`);
    return response.data;
  }

  async create(data: CreateZoneData): Promise<{ data: Zone }> {
    const response = await apiClient.post<{ data: Zone }>('/zones', data);
    return response.data;
  }

  async update(uuid: string, data: UpdateZoneData): Promise<{ data: Zone }> {
    const response = await apiClient.put<{ data: Zone }>(`/zones/${uuid}`, data);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/zones/${uuid}`);
  }
}

export const zoneService = new ZoneService();

