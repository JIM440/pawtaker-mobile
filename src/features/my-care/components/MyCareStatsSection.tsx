import { AppText } from "@/src/shared/components/ui/AppText";
import { Handshake, PawPrint, TrendingUp } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

type Props = {
  hasActiveCare: boolean;
  activeTab: "given" | "received" | "liked";
  stats: { points: number; careGiven: number; careReceived: number };
  colors: Record<string, string>;
  styles: any;
  t: (key: string, options?: any) => string;
};

export function MyCareStatsSection({
  hasActiveCare,
  activeTab,
  stats,
  colors,
  styles,
  t,
}: Props) {
  if (!hasActiveCare) {
    return (
      <View style={styles.summaryGrid}>
        <View
          style={[
            styles.primaryStat,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <View className="flex-row items-center gap-4">
            <View
              style={[
                styles.statIconCircle,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <TrendingUp size={36} color={colors.onSurfaceVariant} />
            </View>
            <View>
              <AppText
                variant="headline"
                style={styles.statLargeValue}
                color={colors.onSurfaceVariant}
              >
                {String(stats.points).padStart(3, "0")}
              </AppText>
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.statLabel}
              >
                {t("myCare.points")}
              </AppText>
            </View>
          </View>
          <View style={styles.athContainer} className="self-end mb-2">
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {t("myCare.allTimeHigh")}{" "}
              <AppText variant="caption" style={{ fontWeight: "700" }}>
                {stats.points}
              </AppText>
            </AppText>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View
            style={[
              styles.secondaryStat,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <View
              style={[
                styles.statIconCircleSmall,
                { backgroundColor: colors.tertiaryContainer },
              ]}
            >
              <Handshake size={28} color={colors.onTertiaryContainer} />
            </View>
            <View>
              <AppText
                variant="headline"
                style={[
                  styles.statSmallValue,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {String(stats.careGiven).padStart(3, "0")}
              </AppText>
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.statLabelSmall}
              >
                {t("myCare.careGivenShort")}
              </AppText>
            </View>
          </View>
          <View
            style={[
              styles.secondaryStat,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <View
              style={[
                styles.statIconCircleSmall,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <PawPrint size={28} color={colors.onPrimaryContainer} />
            </View>
            <View>
              <AppText
                variant="headline"
                style={[
                  styles.statSmallValue,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {String(stats.careReceived).padStart(3, "0")}
              </AppText>
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.statLabelSmall}
              >
                {t("myCare.careReceivedShort")}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.compactStatsRow}>
      <View
        style={[
          styles.compactStatsPill,
          { backgroundColor: colors.surfaceContainerHighest },
        ]}
      >
        <TrendingUp size={16} color={colors.onSurfaceVariant} />
        <AppText variant="caption" style={{ fontWeight: "600" }}>
          {t("myCare.pointsCount", { count: stats.points })}
        </AppText>
      </View>
      <View
        style={[
          styles.compactStatsPill,
          {
            backgroundColor: colors.tertiaryContainer,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <Handshake size={16} color={colors.tertiary} />
        <AppText
          variant="caption"
          style={{ color: colors.tertiary, fontWeight: "600" }}
        >
          {stats.careGiven}
        </AppText>
      </View>
      <View
        style={[
          styles.compactStatsPill,
          {
            backgroundColor: colors.primaryContainer,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <PawPrint size={16} color={colors.onPrimaryContainer} />
        <AppText
          variant="caption"
          style={{ color: colors.onPrimaryContainer, fontWeight: "600" }}
        >
          {stats.careReceived}
        </AppText>
      </View>
    </View>
  );
}
