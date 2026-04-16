import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { useToastStore } from '@/src/lib/store/toast.store';
import {
  hasCoordinatesForDistance,
  hasValidLocation,
} from '@/src/shared/utils/locationGate';

interface LocationGateResult {
  /**
   * Call before any action that requires location (city or coordinates).
   * Returns true if location is present (action can proceed).
   * Returns false if location is missing (toast shown, user redirected).
   */
  checkLocation: () => boolean;
  /** True when the user has city OR coordinates (posting gate). */
  hasLocation: boolean;
  /** True when both latitude and longitude exist (distance features). */
  hasCoordinates: boolean;
}

export function useLocationGate(): LocationGateResult {
  const router = useRouter();
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const showToast = useToastStore((s) => s.showToast);

  const hasLocation = hasValidLocation(profile);
  const hasCoordinates = hasCoordinatesForDistance(profile);

  const checkLocation = useCallback((): boolean => {
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
  }, [profile, router, showToast, t]);

  return { checkLocation, hasLocation, hasCoordinates };
}
