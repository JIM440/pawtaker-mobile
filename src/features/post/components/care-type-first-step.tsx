import { Colors } from "@/src/constants/colors";
import { CARE_TYPE_HINT_ITEMS } from "@/src/features/post/constants/care-type-hints";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { Lightbulb } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

type CareTypeFirstStepProps = {
  careTypes: string[];
  onToggle: (key: string) => void;
  errorMessage?: string;
  /** i18n title — default matches request & availability design */
  titleKey?: string;
  titleText?: string;
};

/**
 * First step of “post a request” and “post availability” — care type + hints card.
 * Keep in sync with Figma; used by both wizards.
 */
export function CareTypeFirstStep({
  careTypes,
  onToggle,
  errorMessage,
  titleKey = "post.availability.careStepTitle",
  titleText,
}: CareTypeFirstStepProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const hasError = Boolean(errorMessage);

  return (
    <View style={styles.stepContainer}>
      <AppText variant="title" style={styles.stepTitle}>
        {titleText ?? t(titleKey)}
      </AppText>
      <View
        style={[
          styles.careTypeWrapper,
          hasError && {
            borderWidth: 1,
            borderColor: colors.error,
            borderRadius: 12,
            padding: 10,
            backgroundColor: colors.errorContainer,
          },
        ]}
      >
        <CareTypeSelector
          selectedKeys={careTypes}
          onToggle={onToggle}
          circleSize={68}
          iconSize={24}
        />
      </View>
      {errorMessage ? (
        <AppText
          variant="caption"
          color={colors.error}
          style={styles.fieldErrorText}
        >
          {errorMessage}
        </AppText>
      ) : null}
      <View
        style={[
          styles.hintsBox,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <View style={styles.hintsTitleRow}>
          <View
            style={[
              styles.lightbulbWrap,
              { backgroundColor: colors.tertiaryContainer },
            ]}
          >
            <Lightbulb size={24} color={colors.onTertiaryContainer} />
          </View>
          <AppText
            variant="title"
            color={colors.onTertiaryContainer}
            style={{ fontWeight: "600", fontSize: 22 }}
          >
            {t("post.availability.hintsTitle")}
          </AppText>
        </View>
        <View>
          {CARE_TYPE_HINT_ITEMS.map((hint, i) => (
            <AppText
              key={i}
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.hintLine}
            >
              <AppText
                variant="caption"
                style={{ fontWeight: "600", lineHeight: 18 }}
              >
                {hint.label}:
              </AppText>{" "}
              {hint.text}
            </AppText>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  careTypeWrapper: {
    marginVertical: 8,
  },
  fieldErrorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  hintsBox: {
    padding: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  hintsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  lightbulbWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  hintLine: {
    fontSize: 12,
    lineHeight: 18,
  },
});
