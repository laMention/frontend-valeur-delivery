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

  /**
   * Récupère la configuration webhook du partenaire
   */
  async getWebhookConfig(): Promise<{ success: boolean; data: WebhookConfig }> {
    const response = await apiClient.get<{ success: boolean; data: WebhookConfig }>('/integrations/webhook');
    return response.data;
  }

  /**
   * Met à jour la configuration webhook du partenaire
   */
  async updateWebhookConfig(data: Partial<WebhookConfig>): Promise<{ success: boolean; data: WebhookConfig; message?: string }> {
    const response = await apiClient.put<{ success: boolean; data: WebhookConfig; message?: string }>('/integrations/webhook', data);
    return response.data;
  }
}

export interface WebhookConfig {
  webhook_url: string | null;
  webhook_enabled: boolean;
}

export const integrationService = new IntegrationService();
