import { userService, type CreateUserData, type UpdateUserData } from '../services/UserService';

class UserController {
  async getAll(params?: { page?: number; per_page?: number; search?: string }) {
    try {
      const response = await userService.getAll(params);
      return { success: true, data: response.data, meta: response.meta };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la récupération des utilisateurs' };
    }
  }

  async getById(uuid: string) {
    try {
      const response = await userService.getById(uuid);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la récupération de l\'utilisateur' };
    }
  }

  async create(data: CreateUserData) {
    try {
      const response = await userService.create(data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur' };
    }
  }

  async update(uuid: string, data: UpdateUserData) {
    try {
      const response = await userService.update(uuid, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur' };
    }
  }

  async delete(uuid: string) {
    try {
      await userService.delete(uuid);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur' };
    }
  }

  async suspend(uuid: string) {
    try {
      const response = await userService.suspend(uuid);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la suspension' };
    }
  }

  async activate(uuid: string) {
    try {
      const response = await userService.activate(uuid);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de l\'activation' };
    }
  }
}

export const userController = new UserController();

