import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { AppText } from "../ui";

type BackHeaderProps = {
  /**
   * Title content. Can be a simple string or a custom React node.
   * When a node is provided, you are responsible for styling it.
   */
  title?: ReactNode;
  /**
   * Optional custom back handler. Defaults to router.back().
   */
  onBack?: () => void;
  /**
   * Optional right-aligned accessory (e.g. menu button).
   */
  rightSlot?: ReactNode;
};

export function BackHeader({ title = "", onBack, rightSlot }: BackHeaderProps) {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View className="flex-row items-center px-4 pt-4 pb-3">
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        activeOpacity={0.7}
        className="mr-3"
      >
        <ArrowLeft
          size={24}
          color={colors.onSurfaceVariant}
        />
      </TouchableOpacity>
      <View className="flex-1 flex-row items-center justify-between">
        {typeof title === "string" ? (
          <AppText variant="headline" style={{ fontSize: 22, fontWeight: "600", color: colors.onSurface }}>
            {title}
          </AppText>
        ) : (
          // Custom title node (e.g., title + badge row)
          title
        )}
        {rightSlot}
      </View>
    </View>
  );
}
