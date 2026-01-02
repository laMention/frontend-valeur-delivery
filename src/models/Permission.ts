export interface Role {
  uuid: string;
  name: string;
  display_name: string;
  is_super_admin?: boolean;
  permissions?: Permission[];
}

export interface Permission {
  uuid: string;
  name: string;
  display_name: string;
}

