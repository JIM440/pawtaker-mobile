export type ContractStatus = 'draft' | 'signed' | 'active' | 'completed';

export interface Contract {
  id: string;
  requestId: string;
  ownerId: string;
  takerId: string;
  signedOwner: boolean;
  signedTaker: boolean;
  status: ContractStatus;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  contractId: string;
  takerId: string;
  photoUrls: string[];
  note: string | null;
  checkedInAt: string;
}

export interface ReviewPayload {
  contractId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}
