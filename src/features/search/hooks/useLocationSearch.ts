import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { hasCoordinatesForDistance } from '@/src/shared/utils/locationGate';

export type SearchMode = 'takers' | 'requests';

export interface NearbyTaker {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  zip_code?: string | null;
  bio: string | null;
  is_verified: boolean;
  experience_years: number;
  accepted_species: string[];
  hourly_points: number;
  distance_km: number | null;
}

export interface NearbyRequest {
  request_id: string;
  owner_id: string;
  owner_name: string | null;
  owner_avatar: string | null;
  owner_city: string | null;
  pet_id: string;
  pet_name: string;
  pet_species: string;
  care_type: string;
  start_date: string;
  end_date: string;
  points_offered: number;
  distance_km: number | null;
}

export interface SearchFilters {
  radiusKm: number;
  careType?: string;
  species?: string;
}

export function useLocationSearch() {
  const profile = useAuthStore((s) => s.profile);
  const [takers, setTakers] = useState<NearbyTaker[]>([]);
  const [requests, setRequests] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLocation = hasCoordinatesForDistance(profile);

  const searchTakers = useCallback(async (filters: SearchFilters) => {
    if (!profile?.latitude || !profile?.longitude) {
      setError('Your location is not set. Please update your profile.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('search_nearby_takers', {
      user_lat: profile.latitude,
      user_lng: profile.longitude,
      radius_km: filters.radiusKm,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      const rows = (data as unknown) as NearbyTaker[];
      const spec = filters.species;
      const results = spec
        ? rows.filter((t) => t.accepted_species.includes(spec))
        : rows;
      setTakers(results);
    }

    setLoading(false);
  }, [profile]);

  const searchRequests = useCallback(async (filters: SearchFilters) => {
    if (!profile?.latitude || !profile?.longitude) {
      setError('Your location is not set. Please update your profile.');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('search_nearby_requests', {
      user_lat: profile.latitude,
      user_lng: profile.longitude,
      radius_km: filters.radiusKm,
      care_type_filter: filters.careType ?? null,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setRequests((data as unknown) as NearbyRequest[]);
    }

    setLoading(false);
  }, [profile]);

  return {
    takers,
    requests,
    loading,
    error,
    hasLocation,
    searchTakers,
    searchRequests,
  };
}
