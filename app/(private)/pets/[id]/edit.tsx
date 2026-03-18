import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Camera, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const { t } = useTranslation();

  // TODO: replace with real data load by id
  const [photos, setPhotos] = useState<string[]>([]);
  const [petName, setPetName] = useState("Polo");
  const [petBio, setPetBio] = useState(
    "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch.",
  );

  const handlePickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const [yardType, setYardType] = useState("fenced yard");
  const [dob, setDob] = useState<Date>(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [energyLevel, setEnergyLevel] = useState("medium energy");
  const [specialNeeds, setSpecialNeeds] = useState(false);

  const dobDisplay = dob ? dob.toLocaleDateString() : "";

  const handleSave = () => {
    // TODO: persist edited pet
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText
          variant="title"
          color={colors.onSurface}
          style={styles.title}
        >
          {t("pets.edit.title", "Edit pet")}
        </AppText>

        <View
          style={[
            styles.photoCard,
            {
              backgroundColor: colors.surfaceContainerHighest,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          {photos.length === 0 ? (
            <TouchableOpacity onPress={handlePickImages} style={styles.emptyPhotoBtn}>
              <AppText
                variant="body"
                color={colors.onSurfaceVariant}
                style={{ textAlign: "center" }}
              >
                {t("pets.edit.addPhotos", "+ Add pet photos")}
              </AppText>
            </TouchableOpacity>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoScrollContent}
            >
              {photos.map((uri) => (
                <View key={uri} style={styles.photoSlide}>
                  <AppImage
                    source={{ uri }}
                    style={styles.photoImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={[styles.removePhotoBtn, { backgroundColor: colors.errorContainer }]}
                    onPress={() => removePhoto(uri)}
                  >
                    <Trash2 size={16} color={colors.onErrorContainer} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={handlePickImages}
                style={[styles.addMorePhotosBtn, { borderColor: colors.outlineVariant }]}
              >
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  + Add more
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.takePhotosBtn,
            {
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surface,
            },
          ]}
          activeOpacity={0.9}
          onPress={handleTakePhoto}
        >
          <Camera size={18} color={colors.onSurface} />
          <AppText
            variant="body"
            color={colors.onSurface}
            style={{ marginLeft: 8 }}
          >
            {t("pets.edit.takeNewPhotos", "or take new photos")}
          </AppText>
        </TouchableOpacity>

        <View style={styles.field}>
          <Input
            label={t("pets.edit.nameLabel", "Pet name")}
            value={petName}
            onChangeText={setPetName}
            maxLength={50}
          />
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.helperText}
          >
            {petName.length}/50
          </AppText>
        </View>

        <View style={styles.field}>
          <Input
            label={t("pets.edit.bioLabel", "Pet short bio")}
            value={petBio}
            onChangeText={setPetBio}
            inputStyle={styles.textArea}
            multiline
            maxLength={300}
          />
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.helperText}
          >
            {petBio.length}/300
          </AppText>
        </View>

        {/* Yard Type Chips */}
        <View style={styles.chipGroup}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.chipGroupLabel}
          >
            {t("pets.edit.yardType", "Yard Type")}
          </AppText>
          <View style={styles.chipRowWrap}>
            {["fenced yard", "high fence", "no yard"].map((label) => {
              const active = yardType === label;
              return (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.chipPill,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                    },
                  ]}
                  onPress={() => setYardType(label)}
                >
                  <AppText
                    variant="caption"
                    color={active ? colors.onPrimary : colors.onSurfaceVariant}
                  >
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date of Birth Picker */}
        <View style={styles.field}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.fieldLabel}
          >
            {t("pets.edit.dob", "Date of birth")}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDobPicker(true)}
            style={[
              styles.dateInput,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <AppText
              variant="body"
              color={dob ? colors.onSurface : colors.onSurfaceVariant}
            >
              {dobDisplay}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Energy Level Chips */}
        <View style={styles.chipGroup}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.chipGroupLabel}
          >
            {t("pets.edit.energyLevel", "Energy Level")}
          </AppText>
          <View style={styles.chipRowWrap}>
            {["calm", "medium energy", "high energy"].map((label) => {
              const active = energyLevel === label;
              return (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.chipPill,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                    },
                  ]}
                  onPress={() => setEnergyLevel(label)}
                >
                  <AppText
                    variant="caption"
                    color={active ? colors.onPrimary : colors.onSurfaceVariant}
                  >
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Special Needs Switch */}
        <View style={styles.toggleRow}>
          <AppText
            variant="body"
            color={colors.onSurface}
            style={{ flex: 1 }}
          >
            {t("pets.edit.specialNeeds", "Does your pet have special needs?")}
          </AppText>
          <Switch
            value={specialNeeds}
            onValueChange={setSpecialNeeds}
            trackColor={{
              false: colors.surfaceContainerHighest,
              true: colors.primary,
            }}
            thumbColor={colors.surface}
          />
        </View>
      </ScrollView>

      {showDobPicker && (
        <View style={styles.datePickerContainer}>
          <DateTimeField
            mode="date"
            label={t("pets.add.age", "Age (years)")}
            value={dob}
            onChange={(d) => {
              setDob(d);
              setShowDobPicker(false);
            }}
          />
        </View>
      )}

      <View style={styles.footer}>
        <Button
          label={t("common.save", "Save")}
          variant="primary"
          fullWidth
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    marginBottom: 4,
  },
  photoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    minHeight: 140,
    justifyContent: "center",
  },
  emptyPhotoBtn: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  photoScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  photoSlide: {
    width: 220,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addMorePhotosBtn: {
    width: 100,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  takePhotosBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  field: {
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: -16,
    marginBottom: 8,
    textAlign: "right",
  },
  chipGroup: {
    marginTop: 16,
  },
  chipGroupLabel: {
    marginBottom: 8,
  },
  chipRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dateInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  datePickerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

