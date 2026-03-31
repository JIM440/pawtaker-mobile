import { ChatTypography } from "@/src/constants/chatTypography";
import { AppText } from "@/src/shared/components/ui/AppText";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

type Props = {
  colors: Record<string, string>;
  styles: any;
  threadHeader: {
    avatarUri: string | null;
    name: string;
    subtitle: string;
  };
  actionsOpen: boolean;
  onBack: () => void;
  onOpenActions: () => void;
};

export function ThreadScreenHeader({
  colors,
  styles,
  threadHeader,
  actionsOpen,
  onBack,
  onOpenActions,
}: Props) {
  return (
    <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
        <ArrowLeft size={24} color={colors.onSurface} />
      </TouchableOpacity>
      <UserAvatar
        uri={threadHeader.avatarUri}
        name={threadHeader.name}
        size={40}
        style={styles.headerAvatar}
      />
      <View style={styles.headerText}>
        <AppText
          variant="body"
          numberOfLines={1}
          style={ChatTypography.threadHeaderName}
        >
          {threadHeader.name}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={ChatTypography.threadHeaderSubtitle}
        >
          {threadHeader.subtitle}
        </AppText>
      </View>
      <TouchableOpacity
        style={[
          styles.menuBtn,
          {
            backgroundColor: actionsOpen
              ? colors.surfaceContainer
              : "transparent",
          },
        ]}
        hitSlop={12}
        onPress={onOpenActions}
      >
        <EllipsisVertical size={24} color={colors.onSurface} />
      </TouchableOpacity>
    </View>
  );
}
