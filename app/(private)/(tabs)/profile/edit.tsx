import { Colors } from "@/src/constants/colors";
import { AvailabilityFormValues, EditAvailabilityTab } from "@/src/features/profile/components/EditAvailabilityTab";
import { EditDetailsTab } from "@/src/features/profile/components/EditDetailsTab";
import { EditPetsTab } from "@/src/features/profile/components/EditPetsTab";
import { uploadToCloudinary } from "@/src/lib/cloudinary/upload";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import type { UserProfile } from "@/src/lib/store/auth.store";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { DataState } from "@/src/shared/components/ui";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import {
  EditAvailabilityFormSkeleton,
  EditProfileDetailsSkeleton,
  ProfilePetsTabSkeleton,
} from "@/src/shared/components/skeletons/ProfileTabSkeletons";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import * as ImagePicker from "expo-image-picker";
import { useToastStore } from "@/src/lib/store/toast.store";
import { useRouter } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

type EditTab = "details" | "pets" | "availability";

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user, profile, fetchProfile, setProfile } = useAuthStore();
  const colors = Colors[resolvedTheme];
  const showToast = useToastStore((s) => s.showToast);

  const [activeTab, setActiveTab] = useState<EditTab>("details");
  const [showDiscard, setShowDiscard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);
  const [petsLoaded, setPetsLoaded] = useState(false);

  const [availabilityInitialValues, setAvailabilityInitialValues] =
    useState<AvailabilityFormValues | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Form state (details)
  // Start empty and populate ONLY from the DB profile so we never show dummy data.
  const [avatarUri, setAvatarUri] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [location, setLocation] = useState("");

  const initialValues = useRef({ username, bio, zipCode, location });

  useEffect(() => {
    // Details form fetch happens only when the "details" tab is active.
    if (!user?.id || activeTab !== "details") return;

    if (!profile) {
      setDetailsLoading(true);
      setDetailsError(null);
      void fetchProfile(user.id).finally(() => {
        // If `fetchProfile` didn't populate the store, we'll just keep the UI empty.
        // (We avoid showing dummy values.)
        setDetailsLoading(false);
      });
      return;
    }

    setDetailsLoading(false);
    setDetailsError(null);

    const nextAvatar = profile.avatar_url ?? "";
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
  }, [fetchProfile, profile, user?.id, activeTab]);

  const defaultAvailabilityValues = useMemo<AvailabilityFormValues>(() => {
    const startTime = (() => {
      const d = new Date();
      d.setHours(8, 0, 0, 0);
      return d;
    })();
    const endTime = (() => {
      const d = new Date();
      d.setHours(21, 0, 0, 0);
      return d;
    })();
    return {
      available: true,
      services: [],
      days: [],
      startTime,
      endTime,
      petOwner: "no",
      yardType: "",
      petKinds: [],
      note: "",
    };
  }, []);

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

  const loadPetsTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setPetsLoading(true);
    setPetsError(null);
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id);
      if (error) throw error;
      setPets(data ?? []);
      setPetsLoaded(true);
    } catch (err) {
      setPetsError(err instanceof Error ? err.message : "Failed to load pets.");
    } finally {
      setPetsLoading(false);
    }
  };

  const loadAvailabilityTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const { data: takerRaw, error } = await supabase
        .from("taker_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      const data = takerRaw as TablesRow<"taker_profiles"> | null;

      const availabilityRaw =
        (data?.availability_json as Record<string, any> | null) ?? null;

      // If the user has not posted availability yet, show an empty state in the edit tab.
      if (!availabilityRaw) {
        setAvailabilityInitialValues(null);
        setAvailabilityLoaded(true);
        return;
      }

      setAvailabilityInitialValues({
        available: availabilityRaw?.available ?? defaultAvailabilityValues.available,
        services: availabilityRaw?.services ?? defaultAvailabilityValues.services,
        days: availabilityRaw?.days ?? defaultAvailabilityValues.days,
        startTime: parseTime(availabilityRaw?.startTime, 8),
        endTime: parseTime(availabilityRaw?.endTime, 21),
        petOwner: availabilityRaw?.petOwner ?? defaultAvailabilityValues.petOwner,
        yardType: availabilityRaw?.yardType ?? defaultAvailabilityValues.yardType,
        petKinds: availabilityRaw?.petKinds ?? defaultAvailabilityValues.petKinds,
        note: availabilityRaw?.note ?? defaultAvailabilityValues.note,
      });
      setAvailabilityLoaded(true);
    } catch (err) {
      setAvailabilityError(
        err instanceof Error
          ? err.message
          : "Failed to load availability.",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    if (activeTab === "pets" && !petsLoading && !petsLoaded && !petsError) {
      void loadPetsTab();
    }
    if (
      activeTab === "availability" &&
      !availabilityLoading &&
      !availabilityLoaded &&
      !availabilityError
    ) {
      void loadAvailabilityTab();
    }
  }, [
    activeTab,
    user?.id,
    petsLoading,
    petsError,
    petsLoaded,
    availabilityLoading,
    availabilityError,
    availabilityLoaded,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === "pets") await loadPetsTab({ refresh: true });
      else if (activeTab === "availability")
        await loadAvailabilityTab({ refresh: true });
      // details tab relies on auth profile; refresh triggers it via store already.
      else if (activeTab === "details" && user?.id) await fetchProfile(user.id);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!user?.id) return;
    Alert.alert(
      t("common.deleteConfirmTitle", "Delete pet?"),
      t(
        "common.deleteConfirmMessage",
        "This will permanently delete the pet from your account.",
      ),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.delete", "Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("pets")
                .delete()
                .eq("id", petId)
                .eq("owner_id", user.id);
              if (error) throw error;

              showToast({
                variant: "success",
                message: t("pets.delete.success", "Pet deleted."),
                durationMs: 2400,
              });

              router.replace({
                pathname: "/(private)/(tabs)/profile",
                params: { tab: "pets", refreshPets: "true" },
              });
            } catch (err) {
              const details = errorMessageFromUnknown(
                err,
                t("common.error", "Something went wrong"),
                t("errors.networkError", "Network error. Check your connection."),
              );
              const friendly = t(
                "pets.delete.failed",
                "Couldn't delete this pet. Please try again.",
              );
              showToast({
                variant: "error",
                message: details === friendly ? friendly : `${friendly} ${details}`,
                durationMs: 3200,
              });
            }
          },
        },
      ],
    );
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

  const handleChooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({
        variant: "error",
        message: t(
          "profile.edit.galleryPermissionRequired",
          "Photo library access is required to choose an image.",
        ),
        durationMs: 3200,
      });
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
      showToast({
        variant: "success",
        message: t("profile.edit.availabilityToast", "Availability updated."),
        durationMs: 2400,
      });
      router.replace({
        pathname: "/(private)/(tabs)/profile",
        params: { tab: "availability", refreshAvailability: "true" },
      });
    } catch (err) {
      const details = errorMessageFromUnknown(
        err,
        t("common.error", "Something went wrong"),
        t("errors.networkError", "Network error. Check your connection."),
      );
      const friendly = t(
        "profile.edit.availabilitySaveFailed",
        "Couldn't update availability. Please try again.",
      );
      showToast({
        variant: "error",
        message: details === friendly ? friendly : `${friendly} ${details}`,
        durationMs: 3200,
      });
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      showToast({
        variant: "error",
        message: t("common.error", "Something went wrong"),
        durationMs: 3200,
      });
      return;
    }

    if (!location.trim()) {
      const msg = t(
        "profile.edit.locationRequired",
        "Please enter your location before saving.",
      );
      showToast({ variant: "error", message: msg, durationMs: 3200 });
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

      setProfile(data as unknown as UserProfile);
      const saved = data as TablesRow<"users">;
      initialValues.current = {
        username: resolveDisplayName(saved as { full_name?: string | null }) || "",
        bio: saved.bio ?? "",
        zipCode: "",
        location: saved.city ?? "",
      };
      showToast({
        variant: "success",
        message: t("profile.edit.toast", "Profile updated."),
        durationMs: 2400,
      });
      router.back();
    } catch (err) {
      const details = errorMessageFromUnknown(
        err,
        t("common.error", "Something went wrong"),
        t("errors.networkError", "Network error. Check your connection."),
      );
      const friendly = t(
        "profile.edit.saveFailed",
        "Couldn't save your profile changes. Please try again.",
      );
      showToast({
        variant: "error",
        message: details === friendly ? friendly : `${friendly} ${details}`,
        durationMs: 3200,
      });
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
          <>
            {detailsLoading ? (
              <EditProfileDetailsSkeleton />
            ) : detailsError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={detailsError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  if (user?.id) void fetchProfile(user.id);
                }}
                mode="inline"
              />
            ) : (
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
                saveLabel={
                  isSaving
                    ? t("common.saving", "Saving...")
                    : t("common.save", "Save")
                }
                isSaving={isSaving}
              />
            )}
          </>
        )}
        {activeTab === "pets" && (
          <>
            {petsLoading ? (
              <ProfilePetsTabSkeleton count={2} />
            ) : petsError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={petsError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setPetsError(null);
                  setPetsLoaded(false);
                  void loadPetsTab({ refresh: true });
                }}
                mode="inline"
              />
            ) : (
              <EditPetsTab
                pets={pets.map((pet) => ({
                  id: pet.id,
                  imageSource: petGalleryUrls(pet)[0] ?? "",
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
                onDeletePet={(id) => {
                  void handleDeletePet(id);
                }}
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
          </>
        )}
        {activeTab === "availability" && (
          <>
            {availabilityLoading ? (
              <EditAvailabilityFormSkeleton />
            ) : availabilityError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={availabilityError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setAvailabilityError(null);
                  setAvailabilityLoaded(false);
                  void loadAvailabilityTab({ refresh: true });
                }}
                mode="inline"
              />
            ) : (
              availabilityInitialValues ? (
                <EditAvailabilityTab
                  key={JSON.stringify({
                    d: availabilityInitialValues.days,
                    s: availabilityInitialValues.services,
                    p: availabilityInitialValues.petKinds,
                    n: availabilityInitialValues.note,
                  })}
                  initialValues={availabilityInitialValues}
                  onSave={handleSaveAvailability}
                  isSaving={isSavingAvailability}
                  saveLabel={
                    isSavingAvailability
                      ? t("common.saving", "Saving...")
                      : t("common.save", "Save")
                  }
                />
              ) : (
                <DataState
                  title={t("profile.availability.emptyTitle", "No availability yet")}
                  message={t(
                    "profile.availability.emptyMessage",
                    "You haven't posted availability yet. Publish availability to show it here.",
                  )}
                  mode="inline"
                />
              )
            )}
          </>
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
    flexGrow: 1,
    paddingBottom: 32,
  },
});
