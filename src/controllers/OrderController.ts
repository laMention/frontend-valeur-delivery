import { orderService, type CreateOrderData, type UpdateOrderData } from '../services/OrderService';

class OrderController {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    partner_id?: string;
    zone_uuid?: string;
  }) {
    try {
      const response = await orderService.getAll(params);
      return { success: true, data: response.data, meta: response.meta };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la récupération des commandes' };
    }
  }

  async getById(uuid: string) {
    try {
      const response = await orderService.getById(uuid);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la récupération de la commande' };
    }
  }

  async create(data: CreateOrderData) {
    try {
      const response = await orderService.create(data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la création de la commande' };
    }
  }

  async update(uuid: string, data: UpdateOrderData) {
    try {
      const response = await orderService.update(uuid, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la mise à jour de la commande' };
    }
  }

  async delete(uuid: string) {
    try {
      await orderService.delete(uuid);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de la suppression de la commande' };
    }
  }

  async importFromFile(file: File) {
    try {
      const response = await orderService.importFromFile(file);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de l\'import' };
    }
  }

  async export(params?: { format?: 'csv' | 'pdf' | 'excel'; filters?: any }) {
    try {
      const blob = await orderService.export(params);
      return { success: true, data: blob };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Erreur lors de l\'export' };
    }
  }
}

export const orderController = new OrderController();

