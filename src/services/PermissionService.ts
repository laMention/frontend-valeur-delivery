import { apiClient } from './apiClient';

export interface Role {
  uuid: string;
  name: string;
  display_name: string;
  is_super_admin?: boolean;
  permissions?: Permission[];
}

export interface Permission {
  uuid: string;
  name: string;
  display_name: string;
}

class PermissionService {
  async getRoles(): Promise<{ data: Role[] }> {
    const response = await apiClient.get<{ data: Role[] }>('/roles');
    return response.data;
  }

  async getPermissions(): Promise<{ data: Permission[] }> {
    const response = await apiClient.get<{ data: Permission[] }>('/permissions');
    return response.data;
  }

  async grantPermission(roleUuid: string, permissionUuid: string): Promise<void> {
    await apiClient.post(`/roles/${roleUuid}/permissions/${permissionUuid}`);
  }

  async revokePermission(roleUuid: string, permissionUuid: string): Promise<void> {
    await apiClient.delete(`/roles/${roleUuid}/permissions/${permissionUuid}`);
  }
}

export const permissionService = new PermissionService();

