import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

/** Edit profile → details tab: avatar + input-shaped blocks (bio area excluded). */
export function EditProfileDetailsSkeleton() {
  return (
    <View style={editDetailsStyles.container}>
      <View style={editDetailsStyles.avatarRow}>
        <Skeleton height={80} width={80} borderRadius={40} />
        <Skeleton height={14} width={120} borderRadius={6} />
      </View>
      <View style={editDetailsStyles.fieldBlock}>
        <Skeleton height={12} width={72} borderRadius={4} />
        <Skeleton height={48} width="100%" borderRadius={12} />
      </View>
      <View style={editDetailsStyles.row}>
        <View style={editDetailsStyles.zipCol}>
          <Skeleton height={12} width={56} borderRadius={4} />
          <Skeleton height={48} width="100%" borderRadius={12} />
        </View>
        <View style={editDetailsStyles.locCol}>
          <Skeleton height={12} width={64} borderRadius={4} />
          <Skeleton height={48} width="100%" borderRadius={12} />
        </View>
      </View>
      <Skeleton height={48} width="100%" borderRadius={12} style={{ marginTop: 4 }} />
    </View>
  );
}

const editDetailsStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  fieldBlock: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  zipCol: {
    width: 100,
    gap: 8,
  },
  locCol: {
    flex: 1,
    gap: 8,
  },
});

/** Matches `ProfilePetCard` row (image + text stack). */
export function ProfilePetCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View style={[petCardSkStyles.card, { backgroundColor: colors.surfaceBright }]}>
      <Skeleton height={92} width={92} borderRadius={12} />
      <View style={petCardSkStyles.body}>
        <Skeleton height={18} width="72%" borderRadius={6} />
        <Skeleton height={12} width="48%" borderRadius={4} />
        <Skeleton height={12} width="90%" borderRadius={4} />
        <Skeleton height={12} width="60%" borderRadius={4} />
      </View>
    </View>
  );
}

export function ProfilePetsTabSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={petListSkStyles.wrap}>
      <Skeleton height={44} width="100%" borderRadius={12} />
      <View style={petListSkStyles.list}>
        {Array.from({ length: count }).map((_, i) => (
          <ProfilePetCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

const petCardSkStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    justifyContent: "center",
  },
});

const petListSkStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
    paddingTop: 8,
  },
  list: {
    gap: 12,
    marginTop: 4,
  },
});

/** Read-only availability tab: preview card + detail cards. */
export function AvailabilityPreviewCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View
      style={[
        availSkStyles.previewCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={availSkStyles.previewHeader}>
        <Skeleton height={80} width={80} borderRadius={40} />
        <View style={availSkStyles.previewCol}>
          <Skeleton height={18} width="85%" borderRadius={6} />
          <View style={availSkStyles.metaRow}>
            <Skeleton height={14} width={36} borderRadius={4} />
            <Skeleton height={14} width={28} borderRadius={4} />
            <Skeleton height={14} width={28} borderRadius={4} />
          </View>
          <Skeleton height={26} width="70%" borderRadius={999} />
          <Skeleton height={26} width="55%" borderRadius={999} />
        </View>
      </View>
    </View>
  );
}

export function AvailabilitySectionCardSkeleton({
  lines = 2,
}: {
  lines?: number;
}) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View
      style={[
        availSkStyles.sectionCard,
        {
          backgroundColor: colors.surfaceBright,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <Skeleton height={11} width={100} borderRadius={4} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? "72%" : "100%"}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
      ))}
    </View>
  );
}

export function ProfileAvailabilityTabSkeleton() {
  return (
    <View style={availSkStyles.tab}>
      <AvailabilityPreviewCardSkeleton />
      <AvailabilitySectionCardSkeleton lines={2} />
      <View style={availSkStyles.twoCol}>
        <View style={{ flex: 1 }}>
          <AvailabilitySectionCardSkeleton lines={1} />
        </View>
        <View style={{ flex: 1 }}>
          <AvailabilitySectionCardSkeleton lines={1} />
        </View>
      </View>
      <View style={availSkStyles.twoCol}>
        <View style={{ flex: 1 }}>
          <AvailabilitySectionCardSkeleton lines={1} />
        </View>
        <View style={{ flex: 1 }}>
          <AvailabilitySectionCardSkeleton lines={1} />
        </View>
      </View>
    </View>
  );
}

const availSkStyles = StyleSheet.create({
  tab: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 32,
  },
  previewCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: "row",
    gap: 12,
  },
  previewCol: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
});

/** Edit availability: toggle row + chip rows + time fields + save. */
export function EditAvailabilityFormSkeleton() {
  return (
    <View style={editAvailStyles.wrap}>
      <View style={editAvailStyles.rowBetween}>
        <Skeleton height={18} width={100} borderRadius={6} />
        <Skeleton height={28} width={48} borderRadius={14} />
      </View>
      <Skeleton height={12} width={140} borderRadius={4} />
      <View style={editAvailStyles.chips}>
        {[56, 72, 64, 80].map((w, i) => (
          <Skeleton key={i} height={32} width={w} borderRadius={999} />
        ))}
      </View>
      <Skeleton height={12} width={88} borderRadius={4} />
      <View style={editAvailStyles.chips}>
        {[44, 44, 44, 44, 52].map((w, i) => (
          <Skeleton key={i} height={36} width={w} borderRadius={8} />
        ))}
      </View>
      <View style={editAvailStyles.timeRow}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={12} width={72} borderRadius={4} />
          <Skeleton height={48} width="100%" borderRadius={12} />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={12} width={72} borderRadius={4} />
          <Skeleton height={48} width="100%" borderRadius={12} />
        </View>
      </View>
      <Skeleton height={48} width="100%" borderRadius={12} style={{ marginTop: 8 }} />
    </View>
  );
}

const editAvailStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
    paddingBottom: 32,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
});

export function ReviewCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View style={[revSkStyles.card, { backgroundColor: colors.surfaceBright }]}>
      <View style={revSkStyles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={10} width={10} borderRadius={2} />
        ))}
      </View>
      <Skeleton height={12} width="100%" borderRadius={4} />
      <Skeleton height={12} width="92%" borderRadius={4} />
      <View style={revSkStyles.footer}>
        <Skeleton height={36} width={120} borderRadius={18} />
        <Skeleton height={12} width={72} borderRadius={4} />
      </View>
    </View>
  );
}

export function ReviewsSummaryCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View
      style={[
        revSkStyles.summary,
        {
          backgroundColor: colors.surfaceBright,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <Skeleton height={14} width="55%" borderRadius={4} />
      <Skeleton height={20} width={100} borderRadius={6} style={{ marginTop: 10 }} />
    </View>
  );
}

export function ProfileReviewsTabSkeleton() {
  return (
    <View style={revSkStyles.list}>
      <ReviewsSummaryCardSkeleton />
      <ReviewCardSkeleton />
      <ReviewCardSkeleton />
    </View>
  );
}

const revSkStyles = StyleSheet.create({
  list: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  summary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  stars: {
    flexDirection: "row",
    gap: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
});
