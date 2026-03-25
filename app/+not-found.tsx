import { useAuthStore } from "@/src/lib/store/auth.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { ResourceMissingState } from "@/src/shared/components/ui";
import { useRouter } from "expo-router";
import React from "react";

/**
 * Unmatched routes (invalid deep links, removed paths). Rendered by Expo Router `+not-found`.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const homeHref = session
    ? ("/(private)/(tabs)/(home)" as const)
    : ("/(auth)/welcome" as const);

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      <BackHeader />
      <ResourceMissingState
        variant="global"
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace(homeHref as any);
        }}
        onHome={() => router.replace(homeHref as any)}
        mode="full"
      />
    </PageContainer>
  );
}
