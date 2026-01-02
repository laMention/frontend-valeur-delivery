export interface User {
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  roles?: Role[];
  created_at: string;
  updated_at: string;
  files?: File[];
}

export interface Role {
  uuid: string;
  name: string;
  display_name: string;
  is_super_admin?: boolean;
}

export interface Permission {
  uuid: string;
  name: string;
  display_name: string;
}

export interface File {
  uuid: string;
  file_path: string;
  url: string;
  category: string;
}
