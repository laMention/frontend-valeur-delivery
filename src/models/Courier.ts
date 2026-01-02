export interface Courier {
  uuid: string;
  id: string;
  user_uuid: string;
  vehicle_type: VehicleType;
  is_active: boolean;
  status?: string;
  current_location?: Location;
  distance_km?: number | null; // Distance calculée si disponible
  user?: {
    uuid: string;
    name: string;
    email: string;
    phone?: string;
  };
  zones?: Array<{
    id: string;
    uuid: string;
    name: string;
    is_primary: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export type VehicleType = 'moto' | 'voiture' | 'velo';

export interface Location {
  lat: number;
  lng: number;
}

