import { apiClient } from './apiClient';

export interface ApiKey {
  api_key: string;
  api_secret_plain?: string | null;
  marketplace_name: string;
  created_at: string;
  last_used_at?: string | null;
}

class IntegrationService {
  async getApiKey(): Promise<{ success: boolean; data: ApiKey | null; message?: string }> {
    const response = await apiClient.get<{ success: boolean; data: ApiKey | null; message?: string }>('/integrations/api-keys');
    return response.data;
  }

  async generateApiKey(marketplaceName: string = 'custom'): Promise<{ success: boolean; data: { api_key: string; api_secret: string; marketplace_name: string }; message?: string }> {
    const response = await apiClient.post<{ success: boolean; data: { api_key: string; api_secret: string; marketplace_name: string }; message?: string }>('/integrations/api-keys', {
      marketplace_name: marketplaceName,
    });
    return response.data;
  }

  async regenerateApiKey(): Promise<{ success: boolean; data: { api_key: string; api_secret: string; marketplace_name: string }; message?: string }> {
    const response = await apiClient.post<{ success: boolean; data: { api_key: string; api_secret: string; marketplace_name: string }; message?: string }>('/integrations/api-keys/regenerate');
    return response.data;
  }

  async hideSecret(): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>('/integrations/api-keys/hide-secret');
    return response.data;
  }

  /**
   * Liste les intégrations du partenaire connecté
   */
  async getPartnerIntegrations(): Promise<{ success: boolean; data: ApiKey[] }> {
    const response = await apiClient.get<{ success: boolean; data: ApiKey[] }>('/integrations/partner/integrations');
    return response.data;
  }
}

export const integrationService = new IntegrationService();
