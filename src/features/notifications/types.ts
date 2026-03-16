export type NotificationType =
  | 'new_request'
  | 'request_matched'
  | 'contract_signed'
  | 'care_started'
  | 'checkin_received'
  | 'care_completed'
  | 'review_received'
  | 'message_received'
  | 'points_earned'
  | 'kyc_approved'
  | 'kyc_rejected';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}
