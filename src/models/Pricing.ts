export interface Pricing {
  uuid: string;
  order_uuid: string;
  distance_km: number;
  vehicle_type: 'moto' | 'voiture';
  price: number;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

