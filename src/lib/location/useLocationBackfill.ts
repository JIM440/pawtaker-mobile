import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { supabase } from '@/src/lib/supabase/client';
import { geocodeCity } from '@/src/lib/location/geocode';

/**
 * Silent one-time backfill for users who already saved a city name
 * before coordinates were introduced.
 *
 * Runs once per session when the private layout mounts. If the profile
 * has a city but no latitude/longitude, it geocodes the city in the
 * background and saves the coordinates — no UI shown, no interruption.
 */
export function useLocationBackfill() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (!profile?.id) return;
    if (!profile.city) return;
    if (profile.latitude != null && profile.longitude != null) return;

    attempted.current = true;

    void (async () => {
      const coords = await geocodeCity(profile.city!);
      if (!coords) return;

      const { data, error } = await supabase
        .from('users')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error || !data) {
        console.warn('[useLocationBackfill] Failed to save coordinates:', error?.message);
        return;
      }

      setProfile(data as any);
    })();
  }, [profile?.id, profile?.city, profile?.latitude, profile?.longitude, setProfile]);
}
