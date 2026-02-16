import { apiClient } from './apiClient';

export type DashboardRole = 'partner' | 'courier' | 'admin';

export interface DashboardActivity {
  type: string;
  description: string;
  created_at: string;
}

// Partenaire
export interface PartnerDashboardData {
  orders: {
    total: number;
    pending: number;
    assigned: number;
    delivering: number;
    delivered: number;
    returned: number;
  };
  financial: {
    total_amount: number;
    delivery_fees: number;
    billable_count: number;
    non_billable_count: number;
  };
  recent_orders: Array<{
    uuid: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
    courier_name?: string;
  }>;
  activities: DashboardActivity[];
}

// Livreur
export interface CourierDashboardData {
  deliveries: {
    assigned_today: number;
    accepted: number;
    in_progress: number;
    delivered: number;
    returned: number;
  };
  performance: {
    success_rate: number;
    total_deliveries: number;
  };
  today_deliveries: Array<{
    uuid: string;
    order_number: string;
    order_uuid: string;
    status: string;
    assigned_at: string;
    delivery_address?: string;
  }>;
  upcoming: Array<{
    uuid: string;
    order_number: string;
    order_uuid: string;
    status: string;
    assigned_at: string;
    delivery_address?: string;
  }>;
  activities: DashboardActivity[];
}

// Admin (stats globales)
export interface AdminDashboardData {
  total_orders: number;
  delivered_orders: number;
  pending_orders: number;
  returned_orders: number;
  average_delivery_time: number;
  total_revenue: number;
  activities: DashboardActivity[];
}

export interface DashboardResponse {
  role: DashboardRole;
  data: PartnerDashboardData | CourierDashboardData | AdminDashboardData;
}

class DashboardService {
  async getDashboard(): Promise<DashboardResponse> {
    const response = await apiClient.get<DashboardResponse>('/dashboard');
    return response.data;
  }
}

export const dashboardService = new DashboardService();
