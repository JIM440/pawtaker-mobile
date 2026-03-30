import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { DataState, ErrorState } from "@/src/shared/components/ui";
import {
  EditAvailabilityFormSkeleton,
  EditProfileDetailsSkeleton,
  ProfilePetsTabSkeleton,
} from "@/src/shared/components/skeletons/ProfileTabSkeletons";
import React from "react";
import { EditAvailabilityTab, type AvailabilityFormValues } from "../EditAvailabilityTab";
import { EditDetailsTab } from "../EditDetailsTab";
import { EditPetsTab } from "../EditPetsTab";

type EditTab = "details" | "pets" | "availability";

type Props = {
  activeTab: EditTab;
  userId?: string;
  t: (key: string, fallback?: string) => string;
  detailsLoading: boolean;
  detailsError: string | null;
  fetchProfile: (id: string) => Promise<void>;
  avatarUri: string;
  username: string;
  bio: string;
  zipCode: string;
  location: string;
  setUsername: (v: string) => void;
  setBio: (v: string) => void;
  setZipCode: (v: string) => void;
  setLocation: (v: string) => void;
  onChooseImage: () => void;
  onSaveDetails: () => void;
  saveLabel: string;
  isSaving: boolean;
  petsLoading: boolean;
  petsError: string | null;
  setPetsError: (v: string | null) => void;
  setPetsLoaded: (v: boolean) => void;
  loadPetsTab: () => void;
  pets: any[];
  onAddPet: () => void;
  onEditPet: (id: string) => void;
  onDeletePet: (id: string) => void;
  onLaunchPetRequest: (id: string) => void;
  availabilityLoading: boolean;
  availabilityError: string | null;
  setAvailabilityError: (v: string | null) => void;
  setAvailabilityLoaded: (v: boolean) => void;
  loadAvailabilityTab: () => void;
  availabilityInitialValues: AvailabilityFormValues | null;
  onSaveAvailability: (values: AvailabilityFormValues) => void;
  isSavingAvailability: boolean;
};

export function EditProfileTabPanels(props: Props) {
  const {
    activeTab,
    userId,
    t,
    detailsLoading,
    detailsError,
    fetchProfile,
    avatarUri,
    username,
    bio,
    zipCode,
    location,
    setUsername,
    setBio,
    setZipCode,
    setLocation,
    onChooseImage,
    onSaveDetails,
    saveLabel,
    isSaving,
    petsLoading,
    petsError,
    setPetsError,
    setPetsLoaded,
    loadPetsTab,
    pets,
    onAddPet,
    onEditPet,
    onDeletePet,
    onLaunchPetRequest,
    availabilityLoading,
    availabilityError,
    setAvailabilityError,
    setAvailabilityLoaded,
    loadAvailabilityTab,
    availabilityInitialValues,
    onSaveAvailability,
    isSavingAvailability,
  } = props;

  return (
    <>
      {activeTab === "details" && (
        <>
          {detailsLoading ? (
            <EditProfileDetailsSkeleton />
          ) : detailsError ? (
            <ErrorState
              error={detailsError}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => {
                if (userId) void fetchProfile(userId);
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
              onChooseImage={onChooseImage}
              onSave={onSaveDetails}
              saveLabel={saveLabel}
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
            <ErrorState
              error={petsError}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => {
                setPetsError(null);
                setPetsLoaded(false);
                loadPetsTab();
              }}
              mode="inline"
            />
          ) : (
            <EditPetsTab
              pets={pets.map((pet) => {
                const parsed = parsePetNotes(pet.notes);
                return {
                  id: pet.id,
                  imageSource: petGalleryUrls(pet)[0] ?? "",
                  petName: pet.name || "Unnamed pet",
                  breed: pet.breed || "Unknown breed",
                  petType: pet.species || "Pet",
                  bio: parsed.bio || "No pet bio yet.",
                  yardType: ((pet as any)?.yard_type ?? parsed.yardType) || null,
                  ageRange: ((pet as any)?.age_range ?? parsed.ageRange) || null,
                  energyLevel: ((pet as any)?.energy_level ?? parsed.energyLevel) || null,
                };
              })}
              onAddPet={onAddPet}
              onEditPet={onEditPet}
              onDeletePet={onDeletePet}
              onLaunchPetRequest={onLaunchPetRequest}
              onSave={onSaveDetails}
            />
          )}
        </>
      )}
      {activeTab === "availability" && (
        <>
          {availabilityLoading ? (
            <EditAvailabilityFormSkeleton />
          ) : availabilityError ? (
            <ErrorState
              error={availabilityError}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => {
                setAvailabilityError(null);
                setAvailabilityLoaded(false);
                loadAvailabilityTab();
              }}
              mode="inline"
            />
          ) : availabilityInitialValues ? (
            <EditAvailabilityTab
              key={JSON.stringify({
                d: availabilityInitialValues.days,
                s: availabilityInitialValues.services,
                p: availabilityInitialValues.petKinds,
                n: availabilityInitialValues.note,
              })}
              initialValues={availabilityInitialValues}
              onSave={onSaveAvailability}
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
          )}
        </>
      )}
    </>
  );
}
