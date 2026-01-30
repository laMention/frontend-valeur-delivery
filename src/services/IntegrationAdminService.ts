import { apiClient } from './apiClient';

export interface Integration {
  id: string;
  marketplace_name: string;
  api_key: string;
  partner: {
    id: string;
    company_name: string;
  } | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface IntegrationFilters {
  partner_id?: string;
  marketplace_name?: string;
  is_active?: string | boolean;
  created_from?: string;
  created_to?: string;
  per_page?: number;
  page?: number;
}

export interface IntegrationListResponse {
  success: boolean;
  data: Integration[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

class IntegrationAdminService {
  /**
   * Liste toutes les intégrations avec filtres et pagination
   */
  async getAllIntegrations(filters: IntegrationFilters = {}): Promise<IntegrationListResponse> {
    const params = new URLSearchParams();
    
    if (filters.partner_id) params.append('partner_id', filters.partner_id);
    if (filters.marketplace_name) params.append('marketplace_name', filters.marketplace_name);
    if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters.created_from) params.append('created_from', filters.created_from);
    if (filters.created_to) params.append('created_to', filters.created_to);
    if (filters.per_page) params.append('per_page', String(filters.per_page));
    if (filters.page) params.append('page', String(filters.page));

    const response = await apiClient.get<IntegrationListResponse>(`/admin/integrations?${params.toString()}`);
    return response.data;
  }

  /**
   * Désactive une intégration
   */
  async disableIntegration(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/admin/integrations/${id}/disable`);
    return response.data;
  }

  /**
   * Réactive une intégration
   */
  async enableIntegration(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/admin/integrations/${id}/enable`);
    return response.data;
  }
}

export default new IntegrationAdminService();
