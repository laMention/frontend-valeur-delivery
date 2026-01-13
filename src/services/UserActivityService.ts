import { apiClient } from './apiClient';

export interface UserActivity {
  type: string;
  description: string;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

class UserActivityService {
  async getRecent(): Promise<{ data: UserActivity[] }> {
    const response = await apiClient.get<{ data: UserActivity[] }>('/user/activities/recent');
    return response.data;
  }

  async getAll(params?: {
    page?: number;
    per_page?: number;
    type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ data: UserActivity[]; meta: PaginationMeta }> {
    const response = await apiClient.get<{ data: UserActivity[]; meta: PaginationMeta }>('/user/activities', { params });
    return response.data;
  }
}

export const userActivityService = new UserActivityService();

