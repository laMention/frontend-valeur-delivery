import { courierService, type CreateCourierData, type UpdateCourierData, type UpdateLocationData } from '../services/CourierService';

class CourierController {
  async getAll(params?: { page?: number; per_page?: number; search?: string; is_active?: boolean }) {
    try {
      const response = await courierService.getAll(params);
      return { success: true, data: response.data, meta: response.meta };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la récupération des livreurs' };
    }
  }

  async getById(uuid: string) {
    try {
      const response = await courierService.getById(uuid);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la récupération du livreur' };
    }
  }

  async create(data: CreateCourierData) {
    try {
      const response = await courierService.create(data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la création du livreur' };
    }
  }

  async update(uuid: string, data: UpdateCourierData) {
    try {
      const response = await courierService.update(uuid, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la mise à jour du livreur' };
    }
  }

  async delete(uuid: string) {
    try {
      await courierService.delete(uuid);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la suppression du livreur' };
    }
  }

  async updateLocation(uuid: string, location: UpdateLocationData) {
    try {
      const response = await courierService.updateLocation(uuid, location);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la mise à jour de la localisation' };
    }
  }

  async getActiveCouriers() {
    try {
      const response = await courierService.getActiveCouriers();
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur' };
    }
  }
}

export const courierController = new CourierController();

