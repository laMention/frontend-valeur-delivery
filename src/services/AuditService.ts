import { apiClient } from './apiClient';

export interface AuditLog {
  uuid: string;
  user_uuid: string;
  action: string;
  target_type?: string;
  target_uuid?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  user?: {
    uuid: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AuditFilters {
  user_uuid?: string;
  action?: string;
  target_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

class AuditService {
  async getAll(filters?: AuditFilters): Promise<{ data: AuditLog[]; meta: any }> {
    const response = await apiClient.get<{ data: AuditLog[]; meta: any }>('/audit-logs', { params: filters });
    return response.data;
  }

  async getById(uuid: string): Promise<{ data: AuditLog }> {
    const response = await apiClient.get<{ data: AuditLog }>(`/audit-logs/${uuid}`);
    return response.data;
  }
}

export const auditService = new AuditService();

