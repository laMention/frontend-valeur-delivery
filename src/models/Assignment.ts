import { Order } from './Order';
import { Courier } from './Courier';

export interface DeliveryAssignment {
  uuid: string;
  order_uuid: string;
  courier_uuid: string;
  assigned_at: string;
  accepted_at?: string;
  completed_at?: string;
  assignment_status: AssignmentStatus;
  order?: Order;
  courier?: Courier;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = 'assigned' | 'accepted' | 'completed' | 'canceled';

