export interface Notification {
  uuid: string;
  user_uuid: string;
  title?: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  is_read?: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'sms' | 'email' | 'push' | 'system';
export type NotificationStatus = 'sent' | 'pending' | 'failed';

