import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import React from "react";
import { useTranslation } from "react-i18next";
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
  onSave?: () => void;
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
  onSave,
}: EditDetailsTabProps) {
  const { t } = useTranslation();
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
            {t("profile.edit.chooseImage", "Choose an image")}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Username */}
      <Input
        label={t("auth.signup.profile.firstName", "Username")}
        value={username}
        onChangeText={onChangeUsername}
      />

      {/* Short Bio */}
      <Input
        label={t("auth.signup.profile.bio", "Short Bio")}
        value={bio}
        onChangeText={onChangeBio}
        inputStyle={styles.textArea}
        multiline
      />

      {/* ZIP Code + Location row */}
      <View style={styles.row}>
        <Input
          label={t("auth.signup.profile.zipCode", "ZIP Code")}
          value={zipCode}
          onChangeText={onChangeZipCode}
          containerStyle={styles.zipField}
          keyboardType="number-pad"
        />
        <Input
          label={t("auth.signup.profile.city", "Location")}
          value={location}
          onChangeText={onChangeLocation}
          containerStyle={styles.locationField}
        />
      </View>

      <Button
        label={t("common.save", "Save")}
        onPress={onSave}
        style={styles.saveBtn}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 8,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  zipField: {
    width: 100,
  },
  locationField: {
    flex: 1,
  },
  saveBtn: {
    marginVertical: 12,
  },
});
