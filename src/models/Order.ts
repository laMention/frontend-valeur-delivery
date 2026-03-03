export interface Order {
  uuid: string;
  order_number: string;
  partner_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  delivery_location?: {
    latitude: number;
    longitude: number;
  };
  pickup_address?: string;
  pickup_location?: {
    latitude: number;
    longitude: number;
  };
  package_weight_kg?: number;
  is_express?: boolean;
  is_prepaid?: boolean;
  zone_uuid: string;
  reserved_at: string;
  total_amount: number;
  order_amount: number;
  status: OrderStatus;
  barcode_value: string;
  items?: OrderItem[];
  pricing?: {
    distance_km: number;
    vehicle_type: 'moto' | 'voiture';
    price: number;
    calculated_at: string;
  };
  zone?: {
    uuid: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'assigned' | 'picked' | 'delivering' | 'delivered' | 'returned' | 'stocked';

export interface OrderItem {
  uuid: string;
  order_uuid: string;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

