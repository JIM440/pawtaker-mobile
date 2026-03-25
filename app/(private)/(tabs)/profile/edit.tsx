import { Colors } from "@/src/constants/colors";
import { AvailabilityFormValues, EditAvailabilityTab } from "@/src/features/profile/components/EditAvailabilityTab";
import { EditDetailsTab } from "@/src/features/profile/components/EditDetailsTab";
import { EditPetsTab } from "@/src/features/profile/components/EditPetsTab";
import { uploadToCloudinary } from "@/src/lib/cloudinary/upload";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { supabase } from "@/src/lib/supabase/client";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { DataState } from "@/src/shared/components/ui";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

type EditTab = "details" | "pets" | "availability";

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user, profile, fetchProfile, setProfile } = useAuthStore();
  const colors = Colors[resolvedTheme];

  const [activeTab, setActiveTab] = useState<EditTab>("details");
  const [showDiscard, setShowDiscard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [availabilityInitialValues, setAvailabilityInitialValues] =
    useState<AvailabilityFormValues | null>(null);

  // Form state
  const [avatarUri, setAvatarUri] = useState(
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  );
  const [username, setUsername] = useState("Jane Ambers");
  const [bio, setBio] = useState(
    "I own a golden retriever. His name is Polo. I love him so much. Then I have Bobby a very cunning and smart cat",
  );
  const [zipCode, setZipCode] = useState("00501");
  const [location, setLocation] = useState("Lake Placid, New York, US");

  const initialValues = useRef({ username, bio, zipCode, location });

  useEffect(() => {
    if (!profile && user?.id) {
      void fetchProfile(user.id);
      return;
    }

    if (!profile) return;

    const nextAvatar =
      profile.avatar_url ??
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200";
    const nextUsername = resolveDisplayName(profile) || "";
    const nextBio = profile.bio ?? "";
    const nextLocation = profile.city ?? "";

    setAvatarUri(nextAvatar);
    setUsername(nextUsername);
    setBio(nextBio);
    setLocation(nextLocation);
    setZipCode("");
    initialValues.current = {
      username: nextUsername,
      bio: nextBio,
      zipCode: "",
      location: nextLocation,
    };
  }, [fetchProfile, profile, user?.id]);

  const loadProfileExtras = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) {
      setIsLoadingData(false);
      return;
    }
    if (!opts?.refresh) {
      setIsLoadingData(true);
    }
    setLoadError(null);
    try {
      const [{ data: petsData, error: petsError }, { data: takerProfileData, error: availabilityError }] =
        await Promise.all([
          supabase.from("pets").select("*").eq("owner_id", user.id),
          supabase.from("taker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        ]);
      if (petsError) throw petsError;
      if (availabilityError) throw availabilityError;

      setPets(petsData ?? []);

      const availabilityRaw =
        (takerProfileData?.availability_json as Record<string, any> | null) ?? null;

      const parseTime = (value: string | undefined, fallbackHour: number) => {
        const d = new Date();
        if (!value) {
          d.setHours(fallbackHour, 0, 0, 0);
          return d;
        }
        const [h, m] = value.split(":");
        d.setHours(Number(h || fallbackHour), Number(m || 0), 0, 0);
        return d;
      };

      setAvailabilityInitialValues({
        available: availabilityRaw?.available ?? false,
        services: availabilityRaw?.services ?? [],
        days: availabilityRaw?.days ?? [],
        startTime: parseTime(availabilityRaw?.startTime, 8),
        endTime: parseTime(availabilityRaw?.endTime, 21),
        petOwner: availabilityRaw?.petOwner ?? "no",
        yardType: availabilityRaw?.yardType ?? "",
        petKinds: availabilityRaw?.petKinds ?? [],
        note: availabilityRaw?.note ?? "",
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load profile edit data.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    void loadProfileExtras();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileExtras({ refresh: true });
    setRefreshing(false);
  };

  const isDirty =
    username !== initialValues.current.username ||
    bio !== initialValues.current.bio ||
    zipCode !== initialValues.current.zipCode ||
    location !== initialValues.current.location;

  const handleBack = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      router.back();
    }
  };

  if (isLoadingData) {
    return (
      <PageContainer>
        <BackHeader
          onBack={() => router.back()}
          title={t("profile.edit.title", "Edit Profile")}
        />
        <DataState
          title={t("common.loading", "Loading...")}
          message={t("profile.edit.loading", "Loading profile data...")}
          mode="full"
        />
      </PageContainer>
    );
  }

  if (loadError) {
    return (
      <PageContainer>
        <BackHeader
          onBack={() => router.back()}
          title={t("profile.edit.title", "Edit Profile")}
        />
        <DataState
          title={t("common.error", "Something went wrong")}
          message={loadError}
          mode="full"
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void loadProfileExtras();
          }}
        />
      </PageContainer>
    );
  }

  const handleChooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t(
          "profile.edit.galleryPermissionRequired",
          "Photo library access is required to choose an image.",
        ),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const formatTime = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const handleSaveAvailability = async (values: AvailabilityFormValues) => {
    if (!user?.id) return;
    setIsSavingAvailability(true);
    try {
      const availabilityJson = {
        available: values.available,
        services: values.services,
        days: values.days,
        startTime: formatTime(values.startTime),
        endTime: formatTime(values.endTime),
        petOwner: values.petOwner,
        yardType: values.yardType,
        petKinds: values.petKinds,
        note: values.note.trim(),
      };

      const upsertPayload = {
        user_id: user.id,
        accepted_species: values.petKinds.length > 0 ? values.petKinds : [],
        max_pets: 0,
        hourly_points: 0,
        experience_years: 0,
        availability_json: availabilityJson,
      };

      const { error } = await supabase
        .from("taker_profiles")
        .upsert(upsertPayload, { onConflict: "user_id" });
      if (error) throw error;

      setAvailabilityInitialValues(values);
      Alert.alert(
        t("common.success", "Success"),
        t("profile.edit.availabilitySaved", "Availability updated successfully."),
      );
      router.back();
    } catch (err) {
      Alert.alert(
        t("common.error", "Something went wrong"),
        err instanceof Error ? err.message : t("common.error", "Something went wrong"),
      );
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert(t("common.error", "Something went wrong"));
      return;
    }

    setIsSaving(true);
    try {
      let uploadedAvatarUrl = avatarUri;
      const isLocalAvatar =
        avatarUri.startsWith("file:") || avatarUri.startsWith("content:");

      if (isLocalAvatar) {
        const uploaded = await uploadToCloudinary(avatarUri);
        uploadedAvatarUrl = uploaded.secure_url;
      }

      const trimmedName = username.trim() || null;
      const payload = {
        full_name: trimmedName,
        bio: bio.trim() || null,
        city: location.trim() || null,
        avatar_url: uploadedAvatarUrl || null,
      };

      const { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", user.id)
        .select("*")
        .single();

      if (error || !data) {
        throw error ?? new Error("Profile update failed");
      }

      setProfile(data);
      initialValues.current = {
        username: resolveDisplayName(data as { full_name?: string | null }) || "",
        bio: data.bio ?? "",
        zipCode: "",
        location: data.city ?? "",
      };
      Alert.alert(
        t("common.success", "Success"),
        t("profile.edit.saved", "Profile updated successfully."),
      );
      router.back();
    } catch (err) {
      Alert.alert(
        t("common.error", "Something went wrong"),
        err instanceof Error ? err.message : t("common.error", "Something went wrong"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0, paddingVertical: 0 }}>
      <BackHeader
        onBack={handleBack}
        title={t("profile.edit.title", "Edit Profile")}
      />

      <View style={{ marginBottom: -16 }}>
        <TabBar<EditTab>
          tabs={[
            {
              key: "details",
              label: t("profile.edit.detailsTab", "Your Details"),
            },
            { key: "pets", label: t("profile.edit.petsTab", "Your Pets") },
            {
              key: "availability",
              label: t("profile.edit.availabilityTab", "Availability"),
            },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        {activeTab === "details" && (
          <EditDetailsTab
            avatarUri={avatarUri}
            username={username}
            bio={bio}
            zipCode={zipCode}
            location={location}
            onChangeUsername={setUsername}
            onChangeBio={setBio}
            onChangeZipCode={setZipCode}
            onChangeLocation={setLocation}
            onChooseImage={() => {
              void handleChooseImage();
            }}
            onSave={handleSave}
            saveLabel={isSaving ? t("common.loading", "Loading...") : t("common.save", "Save")}
            isSaving={isSaving}
          />
        )}
        {activeTab === "pets" && (
          <EditPetsTab
            pets={pets.map((pet) => ({
              id: pet.id,
              imageSource: pet.avatar_url || "",
              petName: pet.name || "Unnamed pet",
              breed: pet.breed || "Unknown breed",
              petType: pet.species || "Pet",
              bio: pet.notes || "No pet bio yet.",
            }))}
            onAddPet={() => {
              if (blockIfKycNotApproved()) return;
              router.push("/(private)/pets/add");
            }}
            onEditPet={(id) =>
              router.push({
                pathname: "/(private)/pets/[id]/edit",
                params: { id },
              })
            }
            onDeletePet={() => { }}
            onLaunchPetRequest={(id) => {
              if (blockIfKycNotApproved()) return;
              router.push({
                pathname: "/(private)/requests/create" as any,
                params: { petId: id },
              });
            }}
            onSave={handleSave}
          />
        )}
        {activeTab === "availability" && (
          <EditAvailabilityTab
            key={
              availabilityInitialValues
                ? JSON.stringify({
                  d: availabilityInitialValues.days,
                  s: availabilityInitialValues.services,
                  p: availabilityInitialValues.petKinds,
                  n: availabilityInitialValues.note,
                })
                : "availability-default"
            }
            initialValues={availabilityInitialValues ?? undefined}
            onSave={handleSaveAvailability}
            isSaving={isSavingAvailability}
          />
        )}
      </ScrollView>

      <FeedbackModal
        visible={showDiscard}
        icon={<CircleAlert size={24} color={colors.primary} />}
        title={t("profile.edit.discardTitle", "Discard changes?")}
        description={t(
          "profile.edit.discardDescription",
          "If you go back now, your progress will be lost.",
        )}
        primaryLabel={t("profile.edit.keepEditing", "Keep Editing")}
        secondaryLabel={t("profile.edit.discard", "Discard")}
        onPrimary={() => setShowDiscard(false)}
        onSecondary={() => {
          setShowDiscard(false);
          router.back();
        }}
        onRequestClose={() => setShowDiscard(false)}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  saveText: {
    textDecorationLine: "underline",
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});
