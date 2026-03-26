import { Colors } from "@/src/constants/colors";
import { uploadToCloudinary } from "@/src/lib/cloudinary/upload";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useKycStore } from "@/src/lib/store/kyc.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { StepProgress } from "@/src/shared/components/ui/StepProgress";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const DOC_UPLOAD_HEIGHT = 244;
const SELFIE_CIRCLE_SIZE = 220;

type KycDocSlotKey = "front" | "back";
type KycDocType = "passport" | "drivers_license" | "national_id";

export default function KycScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const { session, fetchProfile } = useAuthStore();
  const {
    docType,
    frontUri,
    backUri,
    selfieUri,
    setDocType,
    setFrontUri,
    setBackUri,
    setSelfieUri,
    clearKyc,
  } = useKycStore();
  const effectiveDocType = docType ?? "national_id";

  const [page, setPage] = useState(0);
  const [loadingSlot, setLoadingSlot] = useState<
    KycDocSlotKey | "selfie" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docOptions: {
    value: KycDocType;
    label: string;
    title: string;
    subtitle: string;
    frontLabel: string;
    backLabel: string;
  }[] = [
    {
      value: "national_id",
      label: t("auth.kyc.submit.nationalId", "National ID"),
      title: t("auth.kyc.submit.nationalId", "National ID"),
      subtitle: t(
        "auth.kyc.submit.nationalIdSubtitle",
        "Upload a photo or scan of your document",
      ),
      frontLabel: t("auth.kyc.submit.uploadFront", "Upload front"),
      backLabel: t("auth.kyc.submit.uploadBack", "Upload back"),
    },
    {
      value: "drivers_license",
      label: t("auth.kyc.submit.driversLicense", "Driver's License"),
      title: t("auth.kyc.submit.driversLicense", "Driver's License"),
      subtitle: t(
        "auth.kyc.submit.driversLicenseSubtitle",
        "Upload a photo or scan of your driver's license",
      ),
      frontLabel: t("auth.kyc.submit.uploadFront", "Upload front"),
      backLabel: t("auth.kyc.submit.uploadBack", "Upload back"),
    },
    {
      value: "passport",
      label: t("auth.kyc.submit.passport", "Passport"),
      title: t("auth.kyc.submit.passport", "Passport"),
      subtitle: t(
        "auth.kyc.submit.passportSubtitle",
        "Upload a photo or scan of your passport identity page",
      ),
      frontLabel: t("auth.kyc.submit.uploadPassport", "Upload passport page"),
      backLabel: "",
    },
  ];

  const selectedDoc = docOptions.find((opt) => opt.value === effectiveDocType);

  const requiresBack = effectiveDocType !== "passport";
  const canGoSelfie = Boolean(frontUri && (requiresBack ? backUri : true));
  const canSubmit = Boolean(
    frontUri && (requiresBack ? backUri : true) && selfieUri,
  );

  const pickImage = async (
    slot: KycDocSlotKey | "selfie",
    fromCamera: boolean,
  ) => {
    try {
      setLoadingSlot(slot);
      setError(null);

      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t("auth.kyc.submit.cameraPermissionRequired"));
          return;
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            t(
              "auth.kyc.submit.galleryPermissionRequired",
              "Photo library access is required to choose an image.",
            ),
          );
          return;
        }
      }

      const pickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1 as const,
      };

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (slot === "front") setFrontUri(uri);
        else if (slot === "back") setBackUri(uri);
        else if (slot === "selfie") setSelfieUri(uri);
      }
    } finally {
      setLoadingSlot(null);
    }
  };

  const chooseImageSource = (slot: KycDocSlotKey | "selfie") => {
    if (submitting) return;
    Alert.alert(
      t("auth.kyc.submit.pickSourceTitle", "Select image source"),
      undefined,
      [
        {
          text: t("auth.kyc.submit.useCamera", "Use Camera"),
          onPress: () => {
            void pickImage(slot, true);
          },
        },
        {
          text: t("auth.kyc.submit.useGallery", "Choose from Gallery"),
          onPress: () => {
            void pickImage(slot, false);
          },
        },
        { text: t("common.cancel", "Cancel"), style: "cancel" },
      ],
    );
  };

  const submitKyc = async () => {
    if (!session?.user?.id || !effectiveDocType || !frontUri || !selfieUri)
      return;
    if (requiresBack && !backUri) return;

    setSubmitting(true);
    setError(null);
    try {
      const front = await uploadToCloudinary(frontUri);
      let back: { secure_url: string; public_id: string } | null = null;
      if (requiresBack && backUri) {
        back = await uploadToCloudinary(backUri);
      }
      const selfie = await uploadToCloudinary(selfieUri);

      const { error: insertError } = await supabase
        .from("kyc_submissions")
        .insert({
          user_id: session.user.id,
          document_type: effectiveDocType,
          front_url: front.secure_url,
          back_url: back?.secure_url ?? null,
          selfie_url: selfie.secure_url,
          status: "pending",
          submitted_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("users")
        .update({ kyc_status: "pending" })
        .eq("id", session.user.id);
      if (updateError) throw updateError;

      await fetchProfile(session.user.id);
      clearKyc();
      router.replace(
        "/(private)/(tabs)" as Parameters<typeof router.replace>[0],
      );
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : t("auth.kyc.submit.submissionFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goToPage = (next: 0 | 1) => {
    if (next === 1 && !canGoSelfie) return;
    setPage(next);
  };

  /**
   * Border + bg live inside Pressable so the hit area centers the inner box and label.
   */
  const DocUploadSlot = ({
    label,
    uri,
    onPick,
    onRemove,
  }: {
    label: string;
    uri: string | null;
    onPick: () => void;
    onRemove: () => void;
  }) => (
    <View
      style={{
        marginBottom: 16,
        width: "100%",
        alignSelf: "stretch",
        position: "relative",
      }}
    >
      <Pressable
        onPress={onPick}
        disabled={submitting || Boolean(loadingSlot)}
        style={({ pressed }) => ({
          width: "100%",
          alignItems: "center",
          opacity: submitting || loadingSlot ? 0.6 : pressed ? 0.92 : 1,
        })}
      >
        <View
          style={{
            width: "100%",
            height: DOC_UPLOAD_HEIGHT,
            borderRadius: 16,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.outlineVariant,
            backgroundColor: colors.surfaceContainerLowest,
            overflow: "hidden",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
              resizeMode="cover"
            />
          ) : (
            <AppText
              variant="body"
              color={colors.primary}
              style={{
                fontSize: 14,
                lineHeight: 22,
                paddingHorizontal: 8,
                textAlign: "center",
              }}
            >
              {"+ " + label}
            </AppText>
          )}
        </View>
      </Pressable>
      {uri ? (
        <TouchableOpacity
          onPress={onRemove}
          disabled={submitting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            borderRadius: 999,
            backgroundColor: colors.surfaceContainer,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            opacity: submitting ? 0.45 : 1,
          }}
        >
          <X size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const handleHeaderBack = () => {
    if (submitting) return;
    if (page === 1) {
      setPage(0);
      return;
    }
    router.back();
  };

  return (
    <PageContainer>
      <BackHeader
        className="pl-0"
        onBack={handleHeaderBack}
        rightSlot={<StepProgress progress={page === 0 ? 0.5 : 1} width={150} />}
      />

      <ScrollView
        // flex:1 + minHeight:0 — required so the list fills the screen under BackHeader (otherwise height can collapse to 0)
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {page === 0 ? (
          <View style={{ width: "100%" }}>
            <AppText
              variant="caption"
              color={colors.textSecondary}
              style={{ marginBottom: 8 }}
            >
              {t("auth.kyc.submit.docType", "Document type")}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
              style={{ marginBottom: 16 }}
            >
              {docOptions.map((option) => {
                const selected = effectiveDocType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      if (submitting) return;
                      setDocType(option.value);
                      setFrontUri(null);
                      setBackUri(null);
                    }}
                    disabled={submitting}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected
                        ? colors.primary
                        : colors.outlineVariant,
                      backgroundColor: selected
                        ? colors.primaryContainer
                        : colors.surfaceContainerLowest,
                      opacity: submitting ? 0.7 : 1,
                      maxHeight: 40,
                    }}
                  >
                    <AppText
                      variant="caption"
                      color={selected ? colors.primary : colors.textPrimary}
                      style={{ textAlign: "center" }}
                    >
                      {option.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <AppText
              variant="title"
              color={colors.textPrimary}
              style={{ marginBottom: 8 }}
            >
              {selectedDoc?.title ?? t("auth.kyc.submit.title")}
            </AppText>
            <AppText
              variant="body"
              color={colors.textSecondary}
              style={{ marginBottom: 20 }}
            >
              {selectedDoc?.subtitle ?? t("auth.kyc.submit.subtitle")}
            </AppText>
            <AppText
              variant="caption"
              color={colors.textSecondary}
              style={{ marginBottom: 12 }}
            >
              {requiresBack
                ? t(
                    "auth.kyc.submit.requiredImagesTwo",
                    "Required images: 2 document photos",
                  )
                : t(
                    "auth.kyc.submit.requiredImagesOne",
                    "Required images: 1 document photo",
                  )}
            </AppText>

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "stretch",
                width: "100%",
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <DocUploadSlot
                  label={
                    selectedDoc?.frontLabel ??
                    t("auth.kyc.submit.uploadFront", "Upload front")
                  }
                  uri={frontUri}
                  onPick={() => chooseImageSource("front")}
                  onRemove={() => setFrontUri(null)}
                />
              </View>
              {requiresBack ? (
                <View style={{ flex: 1, minWidth: 0 }}>
                  <DocUploadSlot
                    label={
                      selectedDoc?.backLabel ??
                      t("auth.kyc.submit.uploadBack", "Upload back")
                    }
                    uri={backUri}
                    onPick={() => chooseImageSource("back")}
                    onRemove={() => setBackUri(null)}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ width: "100%" }}>
            <AppText
              variant="title"
              color={colors.textPrimary}
              style={{ marginBottom: 8 }}
            >
              {t("auth.kyc.submit.uploadSelfie", "Take a selfie")}
            </AppText>
            <AppText
              variant="body"
              color={colors.textSecondary}
              style={{ marginBottom: 20 }}
            >
              {t("auth.kyc.submit.selfieInstructions")}
            </AppText>

            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <View style={{ position: "relative" }}>
                <Pressable
                  onPress={() => chooseImageSource("selfie")}
                  disabled={submitting || loadingSlot === "selfie"}
                  style={({ pressed }) => ({
                    alignItems: "center",
                    justifyContent: "center",
                    opacity:
                      submitting || loadingSlot === "selfie"
                        ? 0.6
                        : pressed
                          ? 0.92
                          : 1,
                  })}
                >
                  <View
                    style={{
                      width: SELFIE_CIRCLE_SIZE,
                      height: SELFIE_CIRCLE_SIZE,
                      borderRadius: SELFIE_CIRCLE_SIZE / 2,
                      borderColor: colors.outlineVariant,
                      backgroundColor: colors.surfaceContainerLowest,
                      overflow: "hidden",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {selfieUri ? (
                      <ExpoImage
                        source={{ uri: selfieUri }}
                        style={{
                          width: SELFIE_CIRCLE_SIZE,
                          height: SELFIE_CIRCLE_SIZE,
                          borderRadius: SELFIE_CIRCLE_SIZE / 2,
                        }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={150}
                      />
                    ) : (
                      <AppText
                        variant="body"
                        color={colors.primary}
                        style={{
                          fontSize: 14,
                          textAlign: "center",
                          paddingHorizontal: 16,
                        }}
                      >
                        {t("auth.kyc.submit.tapToAddSelfie")}
                      </AppText>
                    )}
                  </View>
                </Pressable>
                {selfieUri ? (
                  <TouchableOpacity
                    onPress={() => setSelfieUri(null)}
                    disabled={submitting}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{
                      position: "absolute",
                      top: 30,
                      right: 30,
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      backgroundColor: colors.surfaceContainerLowest,
                      borderWidth: 1,
                      borderColor: colors.outlineVariant,
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2,
                      opacity: submitting ? 0.45 : 1,
                    }}
                  >
                    <X size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {error ? (
              <AppText
                variant="caption"
                color={colors.error}
                style={{ marginBottom: 12 }}
              >
                {error}
              </AppText>
            ) : null}

            <Button
              label={
                selfieUri
                  ? t("auth.kyc.submit.retakeSelfie", "Retake selfie")
                  : t("auth.kyc.submit.useCamera", "Use Camera")
              }
              onPress={() => pickImage("selfie", true)}
              disabled={submitting || loadingSlot === "selfie"}
            />
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: page === 0 ? 8 : 50,
            marginBottom: 24,
          }}
        >
          {page === 1 && (
            <Button
              label={t("common.previous")}
              variant="outline"
              onPress={() => goToPage(0)}
              fullWidth
              style={{ flex: 1 }}
              disabled={submitting}
            />
          )}
          <Button
            label={
              page === 0
                ? t("common.next")
                : submitting
                  ? t("auth.kyc.submit.progressSubmitting", "Submitting…")
                  : t("common.submit")
            }
            onPress={() => (page === 0 ? goToPage(1) : submitKyc())}
            disabled={page === 0 ? !canGoSelfie : !canSubmit || submitting}
            loading={page === 1 && submitting}
            fullWidth
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </PageContainer>
  );
}
