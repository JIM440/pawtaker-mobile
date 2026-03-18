import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import { useLocalSearchParams, router } from "expo-router";
import { Camera } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
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

        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.photoCard,
            {
              backgroundColor: colors.surfaceContainerHighest,
              borderColor: colors.outlineVariant,
            },
          ]}
          // TODO: hook up picker
          onPress={() => {}}
        >
          {photos.length === 0 ? (
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={{ textAlign: "center" }}
            >
              {t("pets.edit.addPhotos", "+ Add pet photos")}
            </AppText>
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
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
                </View>
              ))}
            </ScrollView>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.takePhotosBtn,
            {
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surface,
            },
          ]}
          activeOpacity={0.9}
          // TODO: hook camera
          onPress={() => {}}
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
            containerStyle={{ marginBottom: 0 }}
            inputStyle={[
              styles.fieldInput,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
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
            containerStyle={{ marginBottom: 0 }}
            inputStyle={[
              styles.textArea,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderColor: colors.outlineVariant,
              },
            ]}
            multiline
          />
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.helperText}
          >
            {petBio.length}/300
          </AppText>
        </View>

        {/* Placeholder for more detail chips/controls to match design */}
      </ScrollView>

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
  photoScrollContent: {
    gap: 8,
  },
  photoSlide: {
    width: 220,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  takePhotosBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  field: {
    marginTop: 16,
  },
  fieldInput: {
    borderRadius: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    borderRadius: 12,
  },
  helperText: {
    marginTop: 4,
    textAlign: "right",
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

