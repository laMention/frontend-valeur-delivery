import { apiClient } from './apiClient';

export interface Partner {
  uuid: string;
  user_uuid: string;
  company_name: string;
  address: string;
  metadata?: any;
  user?: {
    uuid: string;
    name: string;
    email: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreatePartnerData {
  user_uuid: string;
  company_name: string;
  address: string;
  metadata?: any;
}

export interface UpdatePartnerData {
  company_name?: string;
  address?: string;
  metadata?: any;
}

class PartnerService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    name?: string;
    address?: string;
  }): Promise<{ data: Partner[]; meta: any }> {
    const response = await apiClient.get<{ data: Partner[]; meta: any }>('/partners', { params });
    return response.data;
  }

  async getById(uuid: string): Promise<{ data: Partner }> {
    const response = await apiClient.get<{ data: Partner }>(`/partners/${uuid}`);
    return response.data;
  }

  async create(data: CreatePartnerData): Promise<{ data: Partner }> {
    const response = await apiClient.post<{ data: Partner }>('/partners', data);
    return response.data;
  }

  async update(uuid: string, data: UpdatePartnerData): Promise<{ data: Partner }> {
    const response = await apiClient.put<{ data: Partner }>(`/partners/${uuid}`, data);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/partners/${uuid}`);
  }
}

export const partnerService = new PartnerService();

