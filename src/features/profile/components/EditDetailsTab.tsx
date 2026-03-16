import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

type EditDetailsTabProps = {
  avatarUri: string;
  username: string;
  bio: string;
  zipCode: string;
  location: string;
  onChangeUsername: (v: string) => void;
  onChangeBio: (v: string) => void;
  onChangeZipCode: (v: string) => void;
  onChangeLocation: (v: string) => void;
  onChooseImage?: () => void;
};

export function EditDetailsTab({
  avatarUri,
  username,
  bio,
  zipCode,
  location,
  onChangeUsername,
  onChangeBio,
  onChangeZipCode,
  onChangeLocation,
  onChooseImage,
}: EditDetailsTabProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.container}>
      {/* Avatar + Choose image */}
      <View style={styles.avatarRow}>
        <AppImage
          source={{ uri: avatarUri }}
          style={styles.avatar}
          contentFit="cover"
        />
        <TouchableOpacity onPress={onChooseImage} activeOpacity={0.7}>
          <AppText
            variant="label"
            color={colors.onSurface}
            style={styles.chooseImageText}
          >
            Choose an image
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Username */}
      <View
        style={[styles.field, { backgroundColor: colors.surfaceContainerHighest }]}
      >
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
          Username
        </AppText>
        <TextInput
          value={username}
          onChangeText={onChangeUsername}
          style={[styles.fieldInput, { color: colors.onSurface }]}
          placeholderTextColor={colors.onSurfaceVariant}
        />
      </View>

      {/* Short Bio */}
      <View
        style={[
          styles.field,
          styles.fieldMultiline,
          {
            backgroundColor: colors.surfaceContainerHighest,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
          Short Bio
        </AppText>
        <TextInput
          value={bio}
          onChangeText={onChangeBio}
          style={[styles.fieldInput, styles.textArea, { color: colors.onSurfaceVariant }]}
          placeholderTextColor={colors.onSurfaceVariant}
          multiline
        />
      </View>

      {/* ZIP Code + Location row */}
      <View style={styles.row}>
        <View
          style={[styles.field, styles.zipField, { backgroundColor: colors.surfaceContainerHighest }]}
        >
          <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
            ZIP Code
          </AppText>
          <TextInput
            value={zipCode}
            onChangeText={onChangeZipCode}
            style={[styles.fieldInput, { color: colors.onSurface }]}
            placeholderTextColor={colors.onSurfaceVariant}
            keyboardType="number-pad"
          />
        </View>
        <View
          style={[styles.field, styles.locationField, { backgroundColor: colors.surfaceContainerHighest }]}
        >
          <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
            Location
          </AppText>
          <TextInput
            value={location}
            onChangeText={onChangeLocation}
            style={[styles.fieldInput, { color: colors.onSurface }]}
            placeholderTextColor={colors.onSurfaceVariant}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  chooseImageText: {
    textDecorationLine: "underline",
    fontSize: 14,
  },
  field: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  fieldMultiline: {
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: 14,
    padding: 0,
    lineHeight: 20,
  },
  textArea: {
    minHeight: 48,
    textAlignVertical: "top",
    fontSize: 12,
    lineHeight: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  zipField: {
    width: 80,
  },
  locationField: {
    flex: 1,
  },
});
