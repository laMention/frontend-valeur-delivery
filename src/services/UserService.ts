import { apiClient } from './apiClient';

export interface User {
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  roles?: Array<{
    uuid: string;
    name: string;
    display_name: string;
    is_super_admin?: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role_ids?: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  is_active?: boolean;
  role_ids?: string[];
}

class UserService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    name?: string;
    created_from?: string;
    created_to?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<{ data: User[]; meta: any }> {
    const response = await apiClient.get<{ data: User[]; meta: any }>('/users', { params });
    return response.data;
  }

  async getById(uuid: string): Promise<{ data: User }> {
    const response = await apiClient.get<{ data: User }>(`/users/${uuid}`);
    return response.data;
  }

  async create(data: CreateUserData): Promise<{ data: User }> {
    const response = await apiClient.post<{ data: User }>('/users', data);
    return response.data;
  }

  async update(uuid: string, data: UpdateUserData): Promise<{ data: User }> {
    const response = await apiClient.put<{ data: User }>(`/users/${uuid}`, data);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/users/${uuid}`);
  }

  async suspend(uuid: string): Promise<{ data: User }> {
    const response = await apiClient.post<{ data: User }>(`/users/${uuid}/suspend`);
    return response.data;
  }

  async activate(uuid: string): Promise<{ data: User }> {
    const response = await apiClient.post<{ data: User }>(`/users/${uuid}/activate`);
    return response.data;
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<{ data: User; message: string }> {
    const response = await apiClient.post<{ data: User; message: string }>('/users/change-password', data);
    return response.data;
  }
}

export const userService = new UserService();

