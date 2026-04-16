PawTaker Mobile
Location Gate + Search & Filtering
Implementation Guide for Developers
Section 0 — What This Document Covers
This guide covers two connected features:

•	Location Gate — block users from posting a care request or availability profile if they have not saved their location (latitude + longitude) yet. Show a toast and redirect them to update their profile.
•	Search & Filtering — a home screen search that finds takers and care requests sorted by distance from the current user, with radius filtering.

⚠️  The Supabase setup (SQL functions, indexes) must be done before any mobile code is written. Follow all sections in order.

#	Task	Where	Who
1	Enable PostGIS extension	Supabase SQL Editor	Dev
2	Add location index to users table	Supabase SQL Editor	Dev
3	Create search_nearby_takers SQL function	Supabase SQL Editor	Dev
4	Create search_nearby_requests SQL function	Supabase SQL Editor	Dev
5	Create useLocationGate hook	src/lib/location/useLocationGate.ts	Dev
6	Create geocoding utility	src/lib/location/geocode.ts	Dev
7	Create useLocationSearch hook	src/features/search/hooks/useLocationSearch.ts	Dev
8	Wire location gate into post-requests flow	app/(private)/post-requests/index.tsx	Dev
9	Wire location gate into post-availability flow	app/(private)/post-availability/index.tsx	Dev
10	Wire location gate into profile edit	app/(private)/(tabs)/profile/edit.tsx	Dev
11	Wire search hook into home search screen	app/(private)/(tabs)/(home)/search.tsx	Dev

Section 1 — How It Works (Read This First)
1.1  The Location Problem
The users table already has latitude and longitude columns — but most users have not filled them in. They only have a city text field. Without coordinates, distance calculation is impossible.

The plan agreed with the product owner is:
•	Do NOT force existing users to update their location immediately.
•	Enforce it lazily — when a user tries to post a care request or post their availability and their latitude is NULL, block them with a toast and send them to update their location first.
•	Once they save their location (city name geocoded to lat/lng), everything unlocks.

1.2  Geocoding — City Name to Coordinates
When a user types their city name (e.g. 'Douala'), the app must convert that name to latitude and longitude and save both to the users row. We use the OpenStreetMap Nominatim API — it is completely free, requires no API key, and works worldwide.

The flow is:
User types 'Douala' in location field
         ↓
App calls Nominatim API: https://nominatim.openstreetmap.org/search?q=Douala&format=json
         ↓
Gets back: { lat: '4.0610', lon: '9.7680' }
         ↓
Saves city='Douala', latitude=4.0610, longitude=9.7680 to users table
         ↓
Location gate is now unlocked for this user

1.3  Distance Calculation — Haversine Formula in Postgres
Once coordinates are stored, we use the Haversine formula directly in a Postgres function. This calculates the real-world distance (in km) between two points on the earth's surface. No PostGIS is required for the basic formula — but we enable it for indexing performance.

The search works like this:
User opens search on home screen
         ↓
App reads current user's latitude + longitude from auth store
         ↓
Calls Supabase RPC: search_nearby_takers(user_lat, user_lng, radius_km)
         ↓
Postgres runs Haversine formula against all takers with coordinates
         ↓
Returns list sorted by distance_km ascending (nearest first)
         ↓
App renders list with distance badge on each card

1.4  Location Gate Flow
User taps 'Post Care Request' or 'Post Availability'
         ↓
useLocationGate() checks: does profile.latitude exist?
         ↓
       YES                           NO
        ↓                             ↓
Allow navigation             Show toast:
to posting flow              'Please update your location first'
                                      ↓
                             Navigate to profile/edit
                             (location field is pre-focused)

Section 2 — Supabase Setup (Run in SQL Editor)
⚠️  Run all SQL blocks in the Supabase SQL Editor. Run them in the order shown.

2.1  Enable PostGIS Extension
PostGIS adds spatial indexing which makes distance queries fast at scale. Enable it once:

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Add a spatial index on users lat/lng for fast distance queries
-- First we need a computed geometry column for indexing
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS location_point geography(POINT, 4326)
GENERATED ALWAYS AS (
  CASE
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL
    THEN extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::geography
    ELSE NULL
  END
) STORED;

-- Create spatial index on the computed column
CREATE INDEX IF NOT EXISTS users_location_gist
ON public.users USING GIST (location_point);

⚠️  If PostGIS causes an error on your Supabase plan, skip it. The Haversine function in step 2.2 works without PostGIS — it is just slightly slower on very large datasets.

2.2  Create search_nearby_takers Function
This function returns takers sorted by distance from a given point, within a given radius.

CREATE OR REPLACE FUNCTION public.search_nearby_takers(
  user_lat   FLOAT,
  user_lng   FLOAT,
  radius_km  FLOAT DEFAULT 50
)
RETURNS TABLE (
  user_id      UUID,
  full_name    TEXT,
  avatar_url   TEXT,
  city         TEXT,
  bio          TEXT,
  is_verified  BOOLEAN,
  experience_years NUMERIC,
  accepted_species TEXT[],
  hourly_points    INTEGER,
  distance_km  FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.full_name,
    u.avatar_url,
    u.city,
    u.bio,
    u.is_verified,
    tp.experience_years,
    tp.accepted_species,
    tp.hourly_points,
    ROUND((
      6371 * acos(
        LEAST(1.0, cos(radians(user_lat)) * cos(radians(u.latitude))
        * cos(radians(u.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(u.latitude)))
      )
    )::numeric, 1)::float AS distance_km
  FROM public.users u
  INNER JOIN public.taker_profiles tp ON tp.user_id = u.id
  WHERE
    u.latitude IS NOT NULL
    AND u.longitude IS NOT NULL
    AND u.is_verified = true
    AND u.is_deactivated = false
    AND (
      6371 * acos(
        LEAST(1.0, cos(radians(user_lat)) * cos(radians(u.latitude))
        * cos(radians(u.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(u.latitude)))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

2.3  Create search_nearby_requests Function
This function returns open care requests sorted by distance from a given point.

CREATE OR REPLACE FUNCTION public.search_nearby_requests(
  user_lat   FLOAT,
  user_lng   FLOAT,
  radius_km  FLOAT DEFAULT 50,
  care_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  request_id     UUID,
  owner_id       UUID,
  owner_name     TEXT,
  owner_avatar   TEXT,
  owner_city     TEXT,
  pet_id         UUID,
  pet_name       TEXT,
  pet_species    TEXT,
  care_type      TEXT,
  start_date     TEXT,
  end_date       TEXT,
  points_offered INTEGER,
  distance_km    FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.owner_id,
    u.full_name,
    u.avatar_url,
    u.city,
    cr.pet_id,
    p.name,
    p.species,
    cr.care_type,
    cr.start_date::text,
    cr.end_date::text,
    cr.points_offered,
    ROUND((
      6371 * acos(
        LEAST(1.0, cos(radians(user_lat)) * cos(radians(u.latitude))
        * cos(radians(u.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(u.latitude)))
      )
    )::numeric, 1)::float AS distance_km
  FROM public.care_requests cr
  INNER JOIN public.users u ON u.id = cr.owner_id
  INNER JOIN public.pets p ON p.id = cr.pet_id
  WHERE
    cr.status = 'open'
    AND u.latitude IS NOT NULL
    AND u.longitude IS NOT NULL
    AND (care_type_filter IS NULL OR cr.care_type = care_type_filter)
    AND (
      6371 * acos(
        LEAST(1.0, cos(radians(user_lat)) * cos(radians(u.latitude))
        * cos(radians(u.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(u.latitude)))
      )
    ) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

2.4  Grant Access to Both Functions
GRANT EXECUTE ON FUNCTION public.search_nearby_takers TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_nearby_requests TO authenticated;

Section 3 — Geocoding Utility
Create this file at: src/lib/location/geocode.ts

This utility converts a city name to coordinates using the free Nominatim API.

// src/lib/location/geocode.ts

export interface GeocodeResult {
  city: string;
  latitude: number;
  longitude: number;
}

/**
 * Converts a city name or address string to lat/lng coordinates.
 * Uses OpenStreetMap Nominatim — free, no API key required.
 *
 * Usage:
 *   const result = await geocodeCity('Douala');
 *   // { city: 'Douala', latitude: 4.061, longitude: 9.768 }
 */
export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent identifying your app
        'User-Agent': 'PawTaker/1.0 (pawtaker.dev@gmail.com)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (!data || data.length === 0) return null;

    const first = data[0];
    return {
      city: query.trim(),
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
    };
  } catch (error) {
    console.error('[geocodeCity] Error:', error);
    return null;
  }
}

⚠️  Nominatim has a rate limit of 1 request per second. This is fine for a user typing their city — never call it in a loop or on every keystroke. Call it only when the user submits their location.

Section 4 — Location Gate Hook
Create this file at: src/lib/location/useLocationGate.ts

This hook is used by any screen that requires location before proceeding. It checks if the current user has latitude saved, and if not, shows a toast and navigates them to update their profile.

// src/lib/location/useLocationGate.ts

import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { useCallback } from 'react';

interface LocationGateResult {
  /**
   * Call this before any action that requires location.
   * Returns true if location is present (action can proceed).
   * Returns false if location is missing (toast shown, user redirected).
   */
  checkLocation: () => boolean;
  hasLocation: boolean;
}

export function useLocationGate(): LocationGateResult {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const hasLocation = !!(profile?.latitude && profile?.longitude);

  const checkLocation = useCallback((): boolean => {
    if (hasLocation) return true;

    // Show toast — use however toast is shown in the app
    // Replace with your actual toast utility
    import('@/src/shared/components/ui/Toast').then(({ showToast }) => {
      showToast({
        type: 'warning',
        message: 'Please update your location before posting.',
      });
    });

    // Navigate to profile edit — location field should be visible there
    router.push('/(private)/(tabs)/profile/edit');

    return false;
  }, [hasLocation, router]);

  return { checkLocation, hasLocation };
}

⚠️  Replace the showToast import with your actual toast utility used elsewhere in the app. The pattern (dynamic import) is just a placeholder — use whatever toast system is already set up.

Section 5 — Wire Location Gate Into Posting Screens
5.1  Post Care Request Screen
File: app/(private)/post-requests/index.tsx

Add the location gate check at the very beginning of the component, before any form rendering. The gate fires when the screen mounts OR when the user taps the submit/next button — use the mount approach for the cleanest UX:

// app/(private)/post-requests/index.tsx
import { useEffect } from 'react';
import { useLocationGate } from '@/src/lib/location/useLocationGate';

export default function PostRequestScreen() {
  const { checkLocation } = useLocationGate();

  // Check on mount — if no location, user is redirected immediately
  useEffect(() => {
    checkLocation();
  }, []);

  // ... rest of your existing screen code
}

5.2  Post Availability Screen
File: app/(private)/post-availability/index.tsx

Same pattern as above — add the useEffect with checkLocation() at the top of the component:

// app/(private)/post-availability/index.tsx
import { useEffect } from 'react';
import { useLocationGate } from '@/src/lib/location/useLocationGate';

export default function PostAvailabilityScreen() {
  const { checkLocation } = useLocationGate();

  useEffect(() => {
    checkLocation();
  }, []);

  // ... rest of your existing screen code
}

Section 6 — Save Location in Profile Edit Screen
File: app/(private)/(tabs)/profile/edit.tsx

This is where the user types their city. When they save the profile, you must geocode the city name and save latitude + longitude alongside it. Without this step, the location gate will never unlock.

Add this to the save handler in the profile edit screen:

// app/(private)/(tabs)/profile/edit.tsx
import { geocodeCity } from '@/src/lib/location/geocode';
import { supabase } from '@/src/lib/supabase/client';
import { useAuthStore } from '@/src/lib/store/auth.store';

// Inside your save/submit handler:
const handleSave = async () => {
  setLoading(true);

  let latitude = profile?.latitude ?? null;
  let longitude = profile?.longitude ?? null;

  // If city field changed, geocode it
  if (cityValue && cityValue !== profile?.city) {
    const coords = await geocodeCity(cityValue);
    if (coords) {
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else {
      // Geocoding failed — still save the city name, just without coords
      // User will see the gate again next time they try to post
      console.warn('[ProfileEdit] Geocoding failed for:', cityValue);
    }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullNameValue,
      bio: bioValue,
      city: cityValue,
      latitude,
      longitude,
    })
    .eq('id', profile!.id);

  if (error) {
    console.error('[ProfileEdit] Save error:', error);
    setLoading(false);
    return;
  }

  // Refresh the auth store profile so gate checks update immediately
  await useAuthStore.getState().fetchProfile(profile!.id);
  setLoading(false);
  router.back();
};

✅  After saving, always call fetchProfile() to refresh the Zustand store. Without this, the location gate will still see the old null latitude even though the DB has been updated.

Section 7 — Location Search Hook
Create this file at: src/features/search/hooks/useLocationSearch.ts

This hook calls both Supabase RPC functions and returns results for the search screen.

// src/features/search/hooks/useLocationSearch.ts

import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase/client';
import { useAuthStore } from '@/src/lib/store/auth.store';

export type SearchMode = 'takers' | 'requests';

export interface NearbyTaker {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  is_verified: boolean;
  experience_years: number;
  accepted_species: string[];
  hourly_points: number;
  distance_km: number;
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
  distance_km: number;
}

export interface SearchFilters {
  radiusKm: number;           // default 50
  careType?: string;          // for requests: 'sitting' | 'walking' etc.
  species?: string;           // for takers: 'dog' | 'cat' etc.
}

export function useLocationSearch() {
  const profile = useAuthStore((s) => s.profile);
  const [takers, setTakers] = useState<NearbyTaker[]>([]);
  const [requests, setRequests] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(
    !!(profile?.latitude && profile?.longitude)
  );

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
      // Optional: filter by species client-side if needed
      const results = filters.species
        ? (data as NearbyTaker[]).filter(t =>
            t.accepted_species.includes(filters.species!)
          )
        : (data as NearbyTaker[]);
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
      setRequests(data as NearbyRequest[]);
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

Section 8 — Wire Search Screen
File: app/(private)/(tabs)/(home)/search.tsx

Wire the hook into the existing search screen. The screen should have a mode toggle (Takers / Requests), a radius selector, and optional filters. Here is the complete wiring pattern:

// app/(private)/(tabs)/(home)/search.tsx
import { useState, useEffect } from 'react';
import { useLocationSearch, SearchMode } from
  '@/src/features/search/hooks/useLocationSearch';

export default function SearchScreen() {
  const [mode, setMode] = useState<SearchMode>('takers');
  const [radiusKm, setRadiusKm] = useState(50);
  const [careType, setCareType] = useState<string | undefined>();

  const {
    takers,
    requests,
    loading,
    error,
    hasLocation,
    searchTakers,
    searchRequests,
  } = useLocationSearch();

  // Run search whenever mode or filters change
  useEffect(() => {
    if (mode === 'takers') {
      searchTakers({ radiusKm });
    } else {
      searchRequests({ radiusKm, careType });
    }
  }, [mode, radiusKm, careType]);

  // If user has no location — show prompt instead of results
  if (!hasLocation) {
    return <NoLocationPrompt />;  // see note below
  }

  return (
    // Your existing UI — render takers or requests based on mode
    // Each card shows: avatar, name, city, distance_km badge
    // Distance badge example: '3.2 km away'
    <YourExistingSearchUI
      mode={mode}
      onModeChange={setMode}
      radiusKm={radiusKm}
      onRadiusChange={setRadiusKm}
      takers={takers}
      requests={requests}
      loading={loading}
      error={error}
    />
  );
}

// NoLocationPrompt — shown when user has no coordinates saved
// Simple card with message + button to go to profile/edit
function NoLocationPrompt() {
  const router = useRouter();
  return (
    // Render a card telling user to set their location
    // Button: router.push('/(private)/(tabs)/profile/edit')
  );
}

Section 9 — Recommended Radius Filter Options
Use these four options for the radius selector on the search screen:

Label	Value (radiusKm)	Use Case
Nearby	10	Dense urban areas like Douala city center
Close	25	Default for most users
Wide	50	Recommended default — covers most cities
Anywhere	150	Rural areas or when few results found

✅  Default to 50km. If the search returns 0 results, auto-suggest increasing to 150km with a message: 'No takers nearby — try a wider radius?'

Section 10 — Implementation Checklist

Supabase (SQL Editor)
1.	Enable PostGIS extension and add spatial index (Section 2.1)
2.	Create search_nearby_takers function (Section 2.2)
3.	Create search_nearby_requests function (Section 2.3)
4.	Grant EXECUTE permissions to authenticated role (Section 2.4)

New Files to Create
5.	src/lib/location/geocode.ts — geocoding utility (Section 3)
6.	src/lib/location/useLocationGate.ts — gate hook (Section 4)
7.	src/features/search/hooks/useLocationSearch.ts — search hook (Section 7)

Files to Modify
8.	app/(private)/post-requests/index.tsx — add useEffect with checkLocation() (Section 5.1)
9.	app/(private)/post-availability/index.tsx — add useEffect with checkLocation() (Section 5.2)
10.	app/(private)/(tabs)/profile/edit.tsx — add geocoding in save handler (Section 6)
11.	app/(private)/(tabs)/(home)/search.tsx — wire useLocationSearch hook (Section 8)

Testing Steps (in order)
12.	Update profile city to 'Douala' → confirm latitude/longitude saved in DB
13.	Try posting care request with no location → confirm toast + redirect to profile edit
14.	Update location → try posting again → confirm it proceeds
15.	Open search screen → confirm results appear sorted by distance
16.	Change radius → confirm results update
17.	Test with two accounts in different cities → confirm distances are correct

Section 11 — Common Errors

Error	Cause	Fix
Geocoding returns null	City name too vague or typo	Show error: 'Location not found, try a more specific name'
Distance always 0	latitude/longitude saved as strings not numbers	Parse with parseFloat() before saving
RPC returns empty array	User has no latitude in DB	Check users table — latitude column must not be null
acos domain error in Postgres	Floating point precision issue	Use LEAST(1.0, ...) inside acos — already included in the functions above
Gate fires even after location saved	Auth store not refreshed	Call fetchProfile() after saving in profile edit
Nominatim returns wrong city	Query too short or ambiguous	Append country code: geocodeCity('Douala, Cameroon')

PawTaker Mobile — Location Gate & Search — Implementation Guide
