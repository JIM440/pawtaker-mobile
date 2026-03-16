export interface FeedTaker {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  city: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  distanceKm?: number;
  acceptedSpecies: string[];
}

export interface FeedRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  petName: string;
  petSpecies: string;
  careType: string;
  startDate: string;
  endDate: string;
  pointsOffered: number;
  city: string;
}

export interface FeedFilters {
  species?: string;
  careType?: string;
  maxDistanceKm?: number;
  minRating?: number;
}
