import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Input } from "@/src/shared/components/ui/Input";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

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
      <Input
        label="Username"
        value={username}
        onChangeText={onChangeUsername}
        containerStyle={styles.fieldWrap}
        inputStyle={styles.fieldInput}
      />

      {/* Short Bio */}
      <Input
        label="Short Bio"
        value={bio}
        onChangeText={onChangeBio}
        containerStyle={styles.fieldWrap}
        inputStyle={[styles.fieldInput, styles.textArea]}
        multiline
      />

      {/* ZIP Code + Location row */}
      <View style={styles.row}>
        <Input
          label="ZIP Code"
          value={zipCode}
          onChangeText={onChangeZipCode}
          containerStyle={[styles.fieldWrap, styles.zipField]}
          inputStyle={styles.fieldInput}
          keyboardType="number-pad"
        />
        <Input
          label="Location"
          value={location}
          onChangeText={onChangeLocation}
          containerStyle={[styles.fieldWrap, styles.locationField]}
          inputStyle={styles.fieldInput}
        />
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
  fieldWrap: {
    marginBottom: 0,
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
    backgroundColor: "transparent",
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
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
