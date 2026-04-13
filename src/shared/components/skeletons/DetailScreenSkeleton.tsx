import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const H_PAD = 16;

function DetailHeroBelowImage({ bodyPaddingH = H_PAD }: { bodyPaddingH?: number }) {
  return (
    <View style={[heroStyles.body, { paddingHorizontal: bodyPaddingH }]}>
      <View style={heroStyles.titleRow}>
        <View style={heroStyles.titleCol}>
          <Skeleton height={26} width="58%" borderRadius={8} />
          <Skeleton height={14} width="72%" borderRadius={6} style={{ marginTop: 8 }} />
        </View>
        <Skeleton height={28} width={72} borderRadius={999} />
      </View>
      <View style={heroStyles.metaRow}>
        <Skeleton height={14} width={118} borderRadius={6} />
        <Skeleton height={14} width={96} borderRadius={6} />
      </View>
      <View style={heroStyles.metaRow}>
        <Skeleton height={14} width={140} borderRadius={6} />
      </View>
      <Skeleton height={16} width={96} borderRadius={6} style={{ marginTop: 12 }} />
      <Skeleton height={14} width="100%" borderRadius={6} style={{ marginTop: 8 }} />
      <Skeleton height={14} width="92%" borderRadius={6} style={{ marginTop: 6 }} />
      <Skeleton height={14} width="78%" borderRadius={6} style={{ marginTop: 6 }} />
      <View style={[heroStyles.caretakerRow, { marginTop: 16 }]}>
        <Skeleton height={48} width={48} borderRadius={24} />
        <View style={heroStyles.caretakerText}>
          <Skeleton height={12} width={72} borderRadius={4} />
          <Skeleton height={18} width={120} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
        <Skeleton height={36} width={88} borderRadius={999} />
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  body: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  caretakerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  caretakerText: {
    flex: 1,
    minWidth: 0,
  },
});

/** Pet detail: inset 16px gallery + body (matches `pets/[id]`). */
export function PetDetailScreenSkeleton() {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.petScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.petHeroSk}>
        <Skeleton height={300} width="100%" borderRadius={16} />
      </View>
      <DetailHeroBelowImage bodyPaddingH={H_PAD} />
      <View style={{ paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 8 }}>
        <Skeleton height={48} width="100%" borderRadius={12} />
      </View>
    </ScrollView>
  );
}

/**
 * Care request detail: carousel (bleeds when parent has default `PageContainer` padding)
 * + body (matches `post-requests/[id]`).
 */
export function RequestDetailScreenSkeleton() {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.requestScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.requestCarouselBleed}>
        <Skeleton height={216} width="100%" borderRadius={16} />
      </View>
      <DetailHeroBelowImage bodyPaddingH={0} />
      <View style={{ gap: 10, paddingTop: 8 }}>
        <Skeleton height={48} width="100%" borderRadius={12} />
        <Skeleton height={48} width="100%" borderRadius={12} />
      </View>
    </ScrollView>
  );
}

/** Send offer form (matches `offer/[id]`). */
export function OfferDetailScreenSkeleton() {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.formScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton height={44} width="92%" borderRadius={8} />
      <View style={styles.recipientCardSk}>
        <Skeleton height={56} width={56} borderRadius={28} />
        <View style={styles.recipientTextSk}>
          <Skeleton height={12} width={72} borderRadius={4} />
          <Skeleton height={22} width="85%" borderRadius={6} style={{ marginTop: 8 }} />
          <Skeleton height={16} width="70%" borderRadius={6} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton height={14} width={100} borderRadius={4} />
      <View style={styles.careIconsRow}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={56} width={56} borderRadius={28} />
        ))}
      </View>
      <Skeleton height={56} width="100%" borderRadius={12} />
      <Skeleton height={120} width="100%" borderRadius={12} />
    </ScrollView>
  );
}

/** Contract detail card stack (matches `my-care/contract/[id]`). */
export function ContractDetailScreenSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.contractScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Carousel */}
      <View style={{ marginHorizontal: 16, marginTop: 8 }}>
        <Skeleton height={216} width="100%" borderRadius={16} />
      </View>

      {/* Header Section */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        <Skeleton height={28} width="60%" borderRadius={8} />
        <Skeleton height={14} width="80%" borderRadius={6} />
        <Skeleton height={14} width="40%" borderRadius={6} />
        <Skeleton height={60} width="100%" borderRadius={8} style={{ marginTop: 8 }} />
      </View>

      {/* User Cards */}
      <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 16 }}>
        {/* Owner Card (Pill) */}
        <Skeleton height={56} width="100%" borderRadius={28} />
        {/* Taker Card (Home Style) */}
        <View style={{ 
          padding: 16, 
          borderRadius: 20, 
          backgroundColor: colors.surfaceBright,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          flexDirection: 'row',
          gap: 12
        }}>
          <Skeleton height={80} width={80} borderRadius={40} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton height={20} width="70%" borderRadius={6} />
            <Skeleton height={14} width="40%" borderRadius={6} />
            <Skeleton height={14} width="90%" borderRadius={6} />
          </View>
        </View>
      </View>

      {/* Request Info Grid */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 12 }}>
            <Skeleton height={44} width="100%" borderRadius={12} />
            <Skeleton height={44} width="100%" borderRadius={12} />
          </View>
          <Skeleton height={100} width={100} borderRadius={50} />
        </View>
      </View>

      {/* Detail Pills */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 12 }}>
        <Skeleton height={18} width={80} borderRadius={4} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Skeleton height={44} width={100} borderRadius={12} />
          <Skeleton height={44} width={100} borderRadius={12} />
          <Skeleton height={44} width={100} borderRadius={12} />
        </View>
      </View>
    </ScrollView>
  );
}

/** Leave review: centered `ProfileHeader` + stars + comment (matches `my-care/review/[id]`). */
export function ReviewDetailScreenSkeleton() {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.formScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.reviewHeaderSk}>
        <Skeleton height={80} width={80} borderRadius={40} />
        <Skeleton
          height={22}
          width={72}
          borderRadius={4}
          style={{ marginTop: 8 }}
        />
        <Skeleton
          height={28}
          width="56%"
          borderRadius={8}
          style={{ marginTop: 4 }}
        />
        <View style={styles.reviewLocationRowSk}>
          <Skeleton height={20} width={20} borderRadius={10} />
          <Skeleton height={14} width="40%" borderRadius={6} />
        </View>
        <View style={styles.reviewStatsRowSk}>
          <Skeleton height={28} width={84} borderRadius={999} />
          <Skeleton height={28} width={92} borderRadius={999} />
          <Skeleton height={28} width={68} borderRadius={999} />
        </View>
        <Skeleton
          height={28}
          width="70%"
          borderRadius={99}
          style={{ marginTop: 4 }}
        />
      </View>
      <View style={styles.reviewStarsWrap}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={40} width={40} borderRadius={20} />
        ))}
      </View>
      <Skeleton height={16} width={84} borderRadius={6} />
      <Skeleton height={120} width="100%" borderRadius={12} />
    </ScrollView>
  );
}

/** View offer / availability response (matches `post-availability/[id]` scroll body). */
export function ViewOfferDetailScreenSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View>
      <View style={styles.availHeaderRow}>
        <Skeleton height={32} width={32} borderRadius={16} />
        <View style={{ flex: 1, marginLeft: 8, gap: 8 }}>
          <Skeleton height={16} width="40%" borderRadius={6} />
          <Skeleton height={20} width="55%" borderRadius={6} />
        </View>
      </View>
      <View
        style={[
          styles.takerCardSk,
          { backgroundColor: colors.surfaceContainerLowest },
        ]}
      >
        <Skeleton height={80} width={80} borderRadius={40} />
        <View style={styles.takerCardBodySk}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Skeleton height={20} width={120} borderRadius={6} />
            <Skeleton height={24} width={64} borderRadius={999} />
          </View>
          <Skeleton height={14} width="90%" borderRadius={6} style={{ marginTop: 8 }} />
          <Skeleton height={14} width="70%" borderRadius={6} style={{ marginTop: 6 }} />
          <Skeleton height={14} width="85%" borderRadius={6} style={{ marginTop: 12 }} />
        </View>
      </View>
      <Skeleton height={18} width={100} borderRadius={6} style={{ marginBottom: 12 }} />
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.detailRowSk}>
          <Skeleton height={12} width="38%" borderRadius={4} />
          <Skeleton height={28} width="42%" borderRadius={999} />
        </View>
      ))}
      <Skeleton height={14} width="100%" borderRadius={6} style={{ marginTop: 16 }} />
      <Skeleton height={14} width="88%" borderRadius={6} style={{ marginTop: 8 }} />
      <Skeleton height={48} width="100%" borderRadius={12} style={{ marginTop: 20 }} />
    </View>
  );
}

type ChatThreadScreenSkeletonProps = {
  onPressBack?: () => void;
};

/** Chat thread: header + bubbles + composer (matches `chat/[threadId]`). */
export function ChatThreadScreenSkeleton({
  onPressBack,
}: ChatThreadScreenSkeletonProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Header — matches ThreadScreenHeader layout */}
      <View
        style={[
          styles.chatHeader,
          { borderBottomColor: colors.outlineVariant },
        ]}
      >
        {onPressBack ? (
          <TouchableOpacity
            onPress={onPressBack}
            style={styles.chatBackBtn}
            hitSlop={12}
          >
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <Skeleton height={32} width={32} borderRadius={16} />
        )}
        {/* Avatar */}
        <Skeleton height={40} width={40} borderRadius={20} />
        {/* Name + subtitle */}
        <View style={styles.chatHeaderText}>
          <Skeleton height={16} width="55%" borderRadius={6} />
          <Skeleton height={13} width="38%" borderRadius={5} style={{ marginTop: 5 }} />
        </View>
        {/* EllipsisVertical menu button */}
        <Skeleton height={24} width={24} borderRadius={4} />
      </View>

      {/* Message list */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date separator */}
        <View style={styles.dateSeparatorSk}>
          <Skeleton height={1} style={{ flex: 1 }} />
          <Skeleton height={14} width={72} borderRadius={6} />
          <Skeleton height={1} style={{ flex: 1 }} />
        </View>

        {/* Other person — short */}
        <View style={[styles.bubbleSk, { alignSelf: "flex-start" }]}>
          <Skeleton height={36} width={200} borderRadius={16} />
        </View>
        {/* Other person — longer, 2-line */}
        <View style={[styles.bubbleSk, { alignSelf: "flex-start" }]}>
          <Skeleton height={56} width={240} borderRadius={16} />
        </View>

        {/* Me — short reply */}
        <View style={[styles.bubbleSk, { alignSelf: "flex-end" }]}>
          <Skeleton height={36} width={160} borderRadius={16} />
        </View>

        {/* Other person — medium */}
        <View style={[styles.bubbleSk, { alignSelf: "flex-start" }]}>
          <Skeleton height={36} width={220} borderRadius={16} />
        </View>

        {/* Me — longer reply */}
        <View style={[styles.bubbleSk, { alignSelf: "flex-end" }]}>
          <Skeleton height={56} width={200} borderRadius={16} />
        </View>

        {/* Me — short follow-up */}
        <View style={[styles.bubbleSk, { alignSelf: "flex-end" }]}>
          <Skeleton height={36} width={120} borderRadius={16} />
        </View>
      </ScrollView>

      {/* Composer — matches composerWrapper: height 52, pill shape */}
      <View
        style={[
          styles.composerSk,
          {
            backgroundColor: colors.surfaceBright,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        {/* Upload / attach button — 28×28 */}
        <Skeleton height={28} width={28} borderRadius={14} />
        {/* Text input */}
        <Skeleton
          height={20}
          borderRadius={8}
          style={{ flex: 1, marginHorizontal: 4 }}
        />
        {/* Send button — 38×38 */}
        <Skeleton height={38} width={38} borderRadius={19} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  petScrollContent: {
    paddingBottom: 24,
  },
  petHeroSk: {
    marginHorizontal: H_PAD,
    marginTop: 8,
  },
  requestScrollContent: {
    paddingBottom: 24,
  },
  /** Cancel `PageContainer` horizontal padding so the carousel aligns like `carouselBleed`. */
  requestCarouselBleed: {
    marginHorizontal: -H_PAD,
    marginBottom: 8,
    paddingTop: 8,
  },
  formScrollContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 24,
    gap: 16,
  },
  contractScrollContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 24,
    gap: 16,
  },
  contractHeroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  contractHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  contractHeroInfo: {
    flex: 1,
    minWidth: 0,
  },
  contractCareTypesBlock: {
    gap: 8,
  },
  contractCareTypesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  contractCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  contractDetailRowSk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contractDetailSplitRowSk: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  contractPendingBannerSk: {
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  contractPendingCopySk: {
    flex: 1,
    minWidth: 0,
  },
  recipientCardSk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  recipientTextSk: {
    flex: 1,
    minWidth: 0,
  },
  careIconsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  reviewHeaderSk: {
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 0,
  },
  reviewLocationRowSk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  reviewStatsRowSk: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 8,
  },
  reviewStarsWrap: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 8,
  },
  statsRowSk: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  availHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  takerCardSk: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  takerCardBodySk: {
    flex: 1,
    minWidth: 0,
  },
  detailRowSk: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  chatBackBtn: {
    padding: 4,
  },
  chatHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  chatScrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 10,
  },
  dateSeparatorSk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  bubbleSk: {
    maxWidth: "85%",
  },
  composerSk: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
  },
});
