import type { TFunction } from 'i18next';
import type { Router } from 'expo-router';
import type { UserProfile } from '@/src/lib/store/auth.store';

/**
 * A user passes the location gate if they have EITHER:
 * - a city name saved, OR
 * - a coordinate pair (latitude + longitude) saved
 *
 * Only coordinate pairs enable distance calculation, but city alone
 * is enough to allow posting and applying per product rules.
 */
export function hasValidLocation(
  profile: UserProfile | null | undefined,
): boolean {
  if (!profile) return false;
  const hasCoords =
    profile.latitude != null && profile.longitude != null;
  const hasCity =
    typeof profile.city === 'string' && profile.city.trim().length > 0;
  return hasCoords || hasCity;
}

/** True when both coordinates exist (required for server-side distance). */
export function hasCoordinatesForDistance(
  profile: UserProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return profile.latitude != null && profile.longitude != null;
}

export function enforceLocationGate(
  profile: UserProfile | null | undefined,
  router: Router,
  showToast: (opts: {
    variant: 'error' | 'info' | 'success';
    message: string;
    durationMs?: number;
  }) => void,
  t: TFunction,
): boolean {
  if (hasValidLocation(profile)) return true;
  showToast({
    variant: 'error',
    message: t(
      'location.gate.required',
      'Please update your location before continuing.',
    ),
    durationMs: 3200,
  });
  router.push('/(private)/(tabs)/profile/edit' as never);
  return false;
}
