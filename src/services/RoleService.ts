import { apiClient } from './apiClient';
import type { Role, Permission } from '../models/Permission';

export interface StoreRoleData {
  name: string;
  display_name?: string;
  is_super_admin?: boolean;
  permission_ids?: string[];
}

export interface UpdateRoleData {
  name?: string;
  display_name?: string;
  permission_ids?: string[];
}

class RoleService {
  async getAll(params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Role[]; meta: any }> {
    const response = await apiClient.get<{ data: Role[]; meta: any }>('/roles', { params });
    return response.data;
  }

  async getByUuid(uuid: string): Promise<{ data: Role }> {
    const response = await apiClient.get<{ data: Role }>(`/roles/${uuid}`);
    return response.data;
  }

  async create(data: StoreRoleData): Promise<{ data: Role }> {
    const response = await apiClient.post<{ data: Role }>('/roles', data);
    return response.data;
  }

  async update(uuid: string, data: UpdateRoleData): Promise<{ data: Role }> {
    const response = await apiClient.put<{ data: Role }>(`/roles/${uuid}`, data);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/roles/${uuid}`);
  }

  async grantPermission(roleUuid: string, permissionUuid: string): Promise<void> {
    await apiClient.post(`/roles/${roleUuid}/permissions/${permissionUuid}`);
  }

  async revokePermission(roleUuid: string, permissionUuid: string): Promise<void> {
    await apiClient.delete(`/roles/${roleUuid}/permissions/${permissionUuid}`);
  }

  async getUsersByRole(roleName: string, params?: {
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: any[]; meta: any }> {
    const response = await apiClient.get<{ data: any[]; meta: any }>(`/roles/${roleName}/users`, { params });
    return response.data;
  }
}

export const roleService = new RoleService();

