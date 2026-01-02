export interface OptimizedRoute {
  uuid: string;
  courier_uuid: string;
  route_points: RoutePoint[];
  total_distance: number;
  estimated_time: number;
  created_at: string;
  updated_at: string;
}

export interface RoutePoint {
  order_uuid: string;
  address: string;
  customer_name?: string;
  sequence: number;
}

