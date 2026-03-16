export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  pointsBalance: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  language: 'en' | 'fr';
  createdAt: string;
}

export interface Review {
  id: string;
  contractId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string | null;
}
