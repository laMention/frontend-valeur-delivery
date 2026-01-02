export interface ReportStats {
  total_orders: number;
  delivered_orders: number;
  pending_orders: number;
  returned_orders: number;
  average_delivery_time: number;
  total_revenue: number;
}

export interface PartnerPerformance {
  partner_uuid: string;
  partner_name: string;
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  success_rate: number;
}

export interface CourierPerformance {
  courier_uuid: string;
  courier_name: string;
  total_deliveries: number;
  completed_deliveries: number;
  average_delivery_time: number;
}

