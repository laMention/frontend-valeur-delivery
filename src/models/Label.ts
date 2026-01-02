export interface Label {
  uuid: string;
  order_uuid: string;
  label_format: LabelFormat;
  file_path: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export type LabelFormat = 'A6' | 'A7' | 'THERMAL';

