export interface PricingRule {
  uuid: string;
  vehicle_type: 'moto' | 'voiture';
  min_distance_km: number;
  max_distance_km: number | null;
  base_price: number;
  express_price: number | null;
  zone?: {
    uuid: string;
    name: string;
  };
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CalculatePricingData {
  delivery_address: string;
  zone_uuid: string;
  vehicle_type?: 'moto' | 'voiture';
  weight?: number;
  is_express?: boolean;
  origin_address?: string;
}

export interface PricingCalculation {
  distance_km: number;
  vehicle_type: 'moto' | 'voiture';
  price: number;
  estimated_time: number;
  pricing_rule_id?: string;
  is_express?: boolean;
}

