export interface Zone {
  uuid: string;
  name: string;
  polygon: Array<{ lat: number; lng: number }>;
  created_at: string;
  updated_at: string;
}

