export type MessageType = 'text' | 'proposal' | 'agreement' | 'image';

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  type: MessageType;
  metadata?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface Thread {
  id: string;
  participantIds: string[];
  requestId: string | null;
  lastMessageAt: string | null;
  lastMessage?: string;
  otherParticipant?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface CareProposal {
  requestId: string;
  pointsOffered: number;
  message?: string;
}
