import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import {
  Briefcase,
  Sun,
  SunMoon,
  Volleyball,
  type LucideIcon,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";

/** Canonical keys used across feed, post wizards, and profile. */
export const CARE_TYPE_KEYS = [
  "daytime",
  "playwalk",
  "overnight",
  "vacation",
] as const;

export type CareTypeKey = (typeof CARE_TYPE_KEYS)[number];

const CARE_TYPE_ICONS: Record<CareTypeKey, LucideIcon> = {
  daytime: Sun,
  playwalk: Volleyball,
  overnight: SunMoon,
  vacation: Briefcase,
};

export interface CareTypeOption {
  key: string;
  label: string;
  Icon: LucideIcon;
}

interface CareTypeSelectorProps {
  /** When omitted, uses built-in keys, icons (Sun, Volleyball, SunMoon, Briefcase), and i18n labels. */
  options?: CareTypeOption[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  circleSize?: number;
  iconSize?: number;
  /** i18n path for labels, e.g. `feed.careTypes` */
  labelNs?: string;
}

export function CareTypeSelector({
  options: optionsProp,
  selectedKeys,
  onToggle,
  circleSize = 60,
  iconSize = 20,
  labelNs = "feed.careTypes",
}: CareTypeSelectorProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const options = useMemo((): CareTypeOption[] => {
    if (optionsProp?.length) return optionsProp;
    return CARE_TYPE_KEYS.map((key) => ({
      key,
      label: t(`${labelNs}.${key}`),
      Icon: CARE_TYPE_ICONS[key],
    }));
  }, [optionsProp, t, labelNs]);

  return (
    <View style={styles.serviceRow}>
      {options.map(({ key, label, Icon }) => {
        const active = selectedKeys.includes(key);
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.9}
            onPress={() => onToggle(key)}
            style={styles.serviceOption}
          >
            <View
              style={[
                styles.serviceCircle,
                {
                  width: circleSize,
                  height: circleSize,
                  backgroundColor: colors.surfaceContainerHighest,
                  borderColor: active ? colors.primary : "transparent",
                },
              ]}
            >
              <Icon
                size={iconSize}
                color={active ? colors.primary : colors.onSurfaceVariant}
              />
            </View>
            <AppText
              variant="caption"
              color={active ? colors.primary : colors.onSurfaceVariant}
              style={styles.serviceOptionLabel}
            >
              {label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  serviceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 8,
    rowGap: 14,
  },
  serviceOption: {
    alignItems: "center",
    gap: 4,
  },
  serviceCircle: {
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceOptionLabel: {
    fontSize: 12,
    textAlign: "center",
    maxWidth: 88,
  },
});
