import {
  PET_KIND_ILLUSTRATIONS,
  PET_KINDS,
  type PetKindId,
} from "@/src/constants/pet-kinds";
import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type PetKindPickGridProps = {
  selectedKind: PetKindId | null;
  onSelect: (kind: PetKindId) => void;
  /** i18n key for the question line — default matches add-pet step 1 */
  questionKey?: string;
};

/**
 * “What kind of pet?” grid — same layout as `app/(private)/pets/add.tsx` step `kind`.
 */
export function PetKindPickGrid({
  selectedKind,
  onSelect,
  questionKey = "post.availability.petKindQuestion",
}: PetKindPickGridProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View>
      <AppText
        variant="title"
        color={colors.onSurface}
        style={styles.question}
      >
        {t(questionKey)}
      </AppText>
      <View style={styles.grid}>
        {PET_KINDS.map((k) => {
          const active = selectedKind === k;
          return (
            <TouchableOpacity
              key={k}
              style={styles.kindCard}
              activeOpacity={0.9}
              onPress={() => onSelect(k)}
            >
              <View
                style={[
                  styles.kindBox,
                  {
                    borderColor: active
                      ? colors.primary
                      : colors.surfaceContainerHighest,
                    backgroundColor: colors.surfaceContainerHighest,
                  },
                ]}
              >
                <View style={styles.kindIllustrationWrapper}>
                  <AppImage
                    source={PET_KIND_ILLUSTRATIONS[k]}
                    type="svg"
                    style={{ backgroundColor: "transparent" }}
                    contentFit="contain"
                    height={98}
                    width={98}
                  />
                </View>
              </View>
              <AppText
                variant="body"
                style={styles.kindLabel}
                color={active ? colors.primary : colors.onSurface}
              >
                {k}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  question: {
    fontSize: 16,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kindCard: {
    width: "48%",
    alignItems: "center",
    gap: 8,
  },
  kindBox: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
    height: 160,
  },
  kindIllustrationWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    height: 98,
  },
  kindLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
