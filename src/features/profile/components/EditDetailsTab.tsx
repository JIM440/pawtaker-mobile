import { Colors } from "@/src/constants/colors";
import { INPUT_LIMITS } from "@/src/constants/input-limits";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

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
  saveLabel?: string;
  isSaving?: boolean;
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
  saveLabel,
  isSaving = false,
}: EditDetailsTabProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar + Choose image */}
      <View style={styles.avatarRow}>
        <UserAvatar
          uri={avatarUri.trim() ? avatarUri : null}
          name={username}
          size={80}
          showOnlineBadge={false}
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
        maxLength={INPUT_LIMITS.name}
      />

      {/* Short Bio */}
      <Input
        label={t("auth.signup.profile.bio", "Short Bio")}
        value={bio}
        onChangeText={onChangeBio}
        inputStyle={styles.textArea}
        multiline
        maxLength={INPUT_LIMITS.bio}
      />

      {/* ZIP Code + Location row */}
      <View style={styles.row}>
        <View style={styles.zipWrapper}>
          <Input
            label={t("auth.signup.profile.zipCode", "ZIP Code")}
            value={zipCode}
            onChangeText={onChangeZipCode}
            keyboardType="number-pad"
            maxLength={INPUT_LIMITS.zipCode}
          />
        </View>

        <View style={styles.locationWrapper}>
          <Input
            label={t("auth.signup.profile.city", "Location")}
            value={location}
            onChangeText={onChangeLocation}
            maxLength={INPUT_LIMITS.location}
          />
        </View>
      </View>

      <Button
        label={saveLabel ?? t("common.save", "Save")}
        onPress={onSave}
        style={styles.saveBtn}
        fullWidth
        loading={isSaving}
        disabled={isSaving}
      />
    </ScrollView>
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
  zipWrapper: {
    width: 100,
  },

  locationWrapper: {
    flex: 1,
  },
  saveBtn: {
    marginVertical: 12,
  },
});
