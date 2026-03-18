import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { AppText } from "./AppText";

export type TabOption<Key extends string> = {
  key: Key;
  label: string;
};

type TabBarProps<Key extends string> = {
  tabs: TabOption<Key>[];
  activeKey: Key;
  onChange: (key: Key) => void;
  variant?: "underline" | "pill";
  style?: ViewStyle;
};

export function TabBar<Key extends string>({
  tabs,
  activeKey,
  onChange,
  variant = "underline",
  style,
}: TabBarProps<Key>) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View
      style={[
        styles.base,
        variant === "underline" && {
          borderBottomWidth: 1,
          borderBottomColor: colors.outlineVariant,
        },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.item,
              variant === "pill" && {
                borderRadius: SearchFilterStyles.filterPillBorderRadius,
                paddingHorizontal:
                  SearchFilterStyles.filterPillPaddingHorizontal,
                paddingVertical: SearchFilterStyles.filterPillPaddingVertical,
                borderWidth: active ? 0 : 3,
                borderColor: colors.outlineVariant,
                backgroundColor: active ? colors.primary : "transparent",
              },
            ]}
          >
            <AppText
              variant="label"
              color={
                active
                  ? variant === "pill"
                    ? colors.onPrimary
                    : colors.primary
                  : colors.onSurfaceVariant
              }
            >
              {tab.label}
            </AppText>

            {variant === "underline" && active && (
              <View
                style={[
                  styles.indicator,
                  {
                    backgroundColor: colors.primary,
                    height: 3,
                    borderTopLeftRadius: 22,
                    borderTopRightRadius: 22,
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
  },
});
