import { apiClient } from './apiClient';

class FileService {
  async upload(file: File, type: string, relatedId?: string, relatedType?: string, category?: string): Promise<{ data: { uuid: string; file_path: string; url: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (category) {
      formData.append('category', category);
    }
    if (relatedType) {
      formData.append('related_type', relatedType);
    }
    if (relatedId) {
      formData.append('related_id', relatedId);
    }

    const response = await apiClient.post<{ data: { uuid: string; file_path: string; url: string } }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async download(uuid: string): Promise<Blob> {
    const response = await apiClient.get(`/files/${uuid}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getUrl(uuid: string): Promise<string> {
    const response = await apiClient.get<{ data: { url: string } }>(`/files/${uuid}/url`);
    return response.data.data.url;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/files/${uuid}`);
  }
}

export const fileService = new FileService();

