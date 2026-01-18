import { apiClient } from './apiClient';

export interface Notification {
  uuid: string;
  user_uuid: string;
  title?: string;
  message: string;
  type: 'sms' | 'email' | 'push' | 'system';
  status: 'sent' | 'pending' | 'failed';
  is_read?: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

class NotificationService {
  async getAll(params?: { page?: number; per_page?: number; type?: string }): Promise<{ data: Notification[]; meta: PaginationMeta }> {
    const response = await apiClient.get<{ data: Notification[]; meta: PaginationMeta }>('/notifications', { params });
    return response.data;
  }

  async getByUser(userUuid: string, params?: { unread_only?: boolean; read_status?: 'read' | 'unread'; type?: string; page?: number; per_page?: number }): Promise<{ data: Notification[]; meta?: PaginationMeta }> {
    const response = await apiClient.get<{ data: Notification[]; meta?: PaginationMeta }>(`/notifications/user/${userUuid}`, { params });
    return response.data;
  }

  async getMyNotifications(params?: { read_status?: 'read' | 'unread'; type?: string; page?: number; per_page?: number }): Promise<{ data: Notification[]; meta?: PaginationMeta }> {
    const response = await apiClient.get<{ data: Notification[]; meta?: PaginationMeta }>('/user/notifications', { params });
    return response.data;
  }

  async deleteMultiple(notificationIds: string[]): Promise<{ message: string; deleted: number; failed: number }> {
    const response = await apiClient.post<{ message: string; deleted: number; failed: number }>('/user/notifications/delete-multiple', {
      notification_ids: notificationIds,
    });
    return response.data;
  }

  async getUnreadCount(userUuid: string): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>(`/notifications/user/${userUuid}/unread-count`);
    return response.data;
  }

  async markAsRead(uuid: string): Promise<{ data: Notification }> {
    const response = await apiClient.post<{ data: Notification }>(`/notifications/${uuid}/read`);
    return response.data;
  }

  async markAllAsRead(userUuid: string): Promise<void> {
    await apiClient.post(`/notifications/user/${userUuid}/read-all`);
  }
}

export const notificationService = new NotificationService();

