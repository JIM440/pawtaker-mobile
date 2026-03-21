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
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

type IdSlot = "front" | "back";
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

  const { width } = Dimensions.get("window");
  const pageWidth = width - 32;
  const pagerRef = useRef<ScrollView | null>(null);

  const [page, setPage] = useState(0);
  const [loadingSlot, setLoadingSlot] = useState<IdSlot | "selfie" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
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
  const canSubmit = Boolean(frontUri && (requiresBack ? backUri : true) && selfieUri);

  const pickImage = async (slot: IdSlot | "selfie", fromCamera: boolean) => {
    try {
      setLoadingSlot(slot);
      setError(null);

      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t("auth.kyc.submit.cameraPermissionRequired"));
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 1,
          });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (slot === "front") setFrontUri(uri);
        if (slot === "back") setBackUri(uri);
        if (slot === "selfie") setSelfieUri(uri);
      }
    } finally {
      setLoadingSlot(null);
    }
  };

  const chooseImageSource = (slot: IdSlot | "selfie") => {
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
    setProgress(t("auth.kyc.submit.progressUploadingDocs"));
    try {
      const front = await uploadToCloudinary(frontUri);
      let back: { secure_url: string; public_id: string } | null = null;
      if (requiresBack && backUri) {
        setProgress(t("auth.kyc.submit.progressUploadingBack"));
        back = await uploadToCloudinary(backUri);
      }
      setProgress(t("auth.kyc.submit.progressUploadingSelfie"));
      const selfie = await uploadToCloudinary(selfieUri);
      setProgress(t("auth.kyc.submit.progressSubmitting"));

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
      router.replace("/(private)/(tabs)");
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : t("auth.kyc.submit.submissionFailed"),
      );
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const goToPage = (next: 0 | 1) => {
    setPage(next);
    pagerRef.current?.scrollTo({ x: next * pageWidth, animated: true });
  };

  const IdSlot = ({
    label,
    uri,
    onPick,
    onRemove,
    width,
  }: {
    label: string;
    uri: string | null;
    onPick: () => void;
    onRemove: () => void;
    width?: number;
  }) => (
    <View style={{ marginBottom: 16, flex: 1 }}>
      <View
        style={{
          borderWidth: 1.4,
          borderStyle: "dashed",
          borderColor: colors.outlineVariant,
          borderRadius: 16,
          height: 244,
          backgroundColor: colors.surfaceContainer,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {uri ? (
          <>
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={onRemove}
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
              }}
            >
              <X size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={onPick}
            disabled={submitting || Boolean(loadingSlot)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              opacity: submitting || loadingSlot ? 0.6 : 1,
            }}
          >
            <AppText
              variant="body"
              color={colors.primary}
              style={{ fontSize: 14, lineHeight: 22 }}
            >
              {"+ " + label}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <PageContainer>
      <BackHeader
        className="pl-0"
        rightSlot={<StepProgress progress={page === 0 ? 0.5 : 1} width={150} />}
      />

      <ScrollView keyboardShouldPersistTaps="handled">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          horizontal
          pagingEnabled
          scrollEnabled={page === 1 || canGoSelfie}
          ref={pagerRef}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
            if (next === 1 && !canGoSelfie) {
              pagerRef.current?.scrollTo({ x: 0, animated: true });
              setPage(0);
              return;
            }
            setPage(next);
          }}
        >
          <View style={{ width: pageWidth }}>
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
                      // Reset picked document images when changing type
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

            <View style={{ flexDirection: "row", gap: 10 }}>
              <IdSlot
                width={requiresBack ? (pageWidth - 28) / 2 : pageWidth - 18}
                label={
                  selectedDoc?.frontLabel ??
                  t("auth.kyc.submit.uploadFront", "Upload front")
                }
                uri={frontUri}
                onPick={() => chooseImageSource("front")}
                onRemove={() => setFrontUri(null)}
              />
              {requiresBack ? (
                <IdSlot
                  width={(pageWidth - 28) / 2}
                  label={
                    selectedDoc?.backLabel ??
                    t("auth.kyc.submit.uploadBack", "Upload back")
                  }
                  uri={backUri}
                  onPick={() => chooseImageSource("back")}
                  onRemove={() => setBackUri(null)}
                />
              ) : null}
            </View>
          </View>

          <View style={{ width: pageWidth }}>
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
              <View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceDim,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selfieUri ? (
                  <Image
                    source={{ uri: selfieUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : null}
                {selfieUri ? (
                  <TouchableOpacity
                    onPress={() => setSelfieUri(null)}
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
            {submitting && progress ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText variant="body" color={colors.textSecondary}>
                  {progress}
                </AppText>
              </View>
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
        </ScrollView>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flex: 1,
            gap: 8,
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor:
                page === 0 ? colors.primary : colors.outlineVariant,
            }}
          />
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor:
                page === 1 ? colors.primary : colors.outlineVariant,
            }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {page === 1 && (
            <Button
              label={t("common.previous")}
              variant="outline"
              onPress={() => goToPage(0)}
              fullWidth
              style={{ flex: 1 }}
            />
          )}
          <Button
            label={
              page === 0 ? t("common.next") : t("common.submit")
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
