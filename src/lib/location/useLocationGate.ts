import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { useToastStore } from '@/src/lib/store/toast.store';

interface LocationGateResult {
  /**
   * Call before any action that requires location.
   * Returns true if location is present (action can proceed).
   * Returns false if location is missing (toast shown, user redirected).
   */
  checkLocation: () => boolean;
  hasLocation: boolean;
}

export function useLocationGate(): LocationGateResult {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const showToast = useToastStore((s) => s.showToast);

  const hasLocation = !!(profile?.latitude && profile?.longitude);

  const checkLocation = useCallback((): boolean => {
    if (hasLocation) return true;

    showToast({
      variant: 'info',
      message: 'Please update your location before posting.',
      durationMs: 3500,
    });

    router.push('/(private)/(tabs)/profile/edit' as any);

    return false;
  }, [hasLocation, router, showToast]);

  return { checkLocation, hasLocation };
}
