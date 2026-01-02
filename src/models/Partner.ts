export interface Partner {
  uuid: string;
  user_uuid: string;
  company_name: string;
  address: string;
  metadata?: any;
  user?: {
    uuid: string;
    name: string;
    email: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

