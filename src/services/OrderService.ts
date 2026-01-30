import { apiClient } from './apiClient';
import type { Order, OrderItem } from '../models/Order';

// Réexporter les types depuis models pour compatibilité
export type { Order, OrderItem };

export interface CreateOrderData {
  order_number: string;
  partner_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  package_weight_kg: number;
  is_express?: boolean;
  zone_uuid: string;
  reserved_at: string;
  total_amount?: number;
  order_amount?: number;
  items?: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

export interface UpdateOrderData {
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  package_weight_kg?: number;
  is_express?: boolean;
  zone_uuid?: string;
  reserved_at?: string;
  total_amount?: number;
  order_amount?: number;
  status?: Order['status'];
}

class OrderService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    partner_id?: string;
    zone_uuid?: string;
    date_filter?: 'today' | 'yesterday' | 'last_7_days';
    start_date?: string;
    end_date?: string;
    sort_by?: 'newest' | 'oldest' | string;
    sort_order?: 'asc' | 'desc';
  }): Promise<{ data: Order[]; meta: any }> {
    const response = await apiClient.get<{ data: Order[]; meta: any }>('/orders', { params });
    return response.data;
  }

  async getById(uuid: string): Promise<{ data: Order }> {
    const response = await apiClient.get<{ data: Order }>(`/orders/${uuid}`);
    return response.data;
  }

  async create(data: CreateOrderData): Promise<{ data: Order }> {
    const response = await apiClient.post<{ data: Order }>('/orders', data);
    return response.data;
  }

  async update(uuid: string, data: UpdateOrderData): Promise<{ data: Order }> {
    const response = await apiClient.put<{ data: Order }>(`/orders/${uuid}`, data);
    return response.data;
  }

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`/orders/${uuid}`);
  }

  async import(file: File): Promise<{ success: boolean; message: string; data: { success: number; failed: number; errors: Array<{ line: number; message: string }> } }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ success: boolean; message: string; data: { success: number; failed: number; errors: Array<{ line: number; message: string }> } }>('/orders/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async export(filters?: any, format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    const params = { ...filters, format };
    const response = await apiClient.get('/orders/export', {
      params,
      responseType: 'blob',
    });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `commandes_${new Date().toISOString().split('T')[0]}.${format}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async downloadTemplate(format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    const response = await apiClient.get('/orders/import-template', {
      params: { format },
      responseType: 'blob',
    });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `modele_import_commandes.${format}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Pré-calcul des frais de livraison (avant sauvegarde) — même logique que le calcul final.
   */
  async previewPricing(params: {
    pickup_address?: string;
    pickup_latitude?: number;
    pickup_longitude?: number;
    delivery_address?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    zone_id?: string;
    package_weight?: number;
    is_express?: boolean;
  }): Promise<{
    distance_km: number;
    vehicle_type: string;
    delivery_fees: number;
    estimated_time_minutes: number;
  }> {
    const response = await apiClient.post<{
      distance_km: number;
      vehicle_type: string;
      delivery_fees: number;
      estimated_time_minutes: number;
    }>('/orders/preview-pricing', params);
    return response.data;
  }

  async getRoute(uuid: string): Promise<{
    data: {
      route: {
        start_address: string;
        end_address: string;
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
        steps: Array<{
          instruction: string;
          distance: string;
          duration: string;
          start_location: { lat: number; lng: number };
          end_location: { lat: number; lng: number };
        }>;
      };
      distance_km: number;
      duration_minutes: number;
      polyline: string;
    };
  }> {
    const response = await apiClient.get<{
      data: {
        route: {
          start_address: string;
          end_address: string;
          start_location: { lat: number; lng: number };
          end_location: { lat: number; lng: number };
          steps: Array<{
            instruction: string;
            distance: string;
            duration: string;
            start_location: { lat: number; lng: number };
            end_location: { lat: number; lng: number };
          }>;
        };
        distance_km: number;
        duration_minutes: number;
        polyline: string;
      };
    }>(`/orders/${uuid}/route`);
    return response.data;
  }
}

export const orderService = new OrderService();

