import { apiClient } from './apiClient';

export interface Label {
  uuid: string;
  order_uuid: string;
  label_format: 'A6' | 'A7' | 'THERMAL';
  file_path: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateLabelData {
  order_uuid: string;
  format: 'A6' | 'A7' | 'THERMAL';
}

class LabelService {
  async generate(data: GenerateLabelData): Promise<{ data: Label }> {
    const response = await apiClient.post<{ data: Label }>('/labels/generate', data);
    return response.data;
  }

  async download(uuid: string): Promise<Blob> {
    const response = await apiClient.get(`/labels/${uuid}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getByOrder(orderUuid: string): Promise<{ data: Label[] }> {
    const response = await apiClient.get<{ data: Label[] }>(`/labels/order/${orderUuid}`);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/labels/${uuid}`);
  }
}

export const labelService = new LabelService();

