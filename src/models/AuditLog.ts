export interface AuditLog {
  uuid: string;
  user_uuid: string;
  action: string;
  target_type?: string;
  target_uuid?: string;
  details?: {
    old_value?: any;
    new_value?: any;
    [key: string]: any;
  };
  ip_address?: string;
  user_agent?: string;
  user?: {
    uuid: string;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

