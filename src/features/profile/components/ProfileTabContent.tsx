import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { ErrorState } from "@/src/shared/components/ui";
import {
  ProfileAvailabilityTabSkeleton,
  ProfilePetsTabSkeleton,
  ProfileReviewsTabSkeleton,
} from "@/src/shared/components/skeletons/ProfileTabSkeletons";
import React from "react";
import { ProfileAvailabilityTab } from "./ProfileAvailabilityTab";
import { ProfileBioTab } from "./ProfileBioTab";
import { ProfilePetsTab } from "./ProfilePetsTab";
import { ProfileReviewsTab } from "./ProfileReviewsTab";

type ProfileTab = "pets" | "availability" | "bio" | "reviews";

type Props = {
  activeTab: ProfileTab;
  t: (key: string, fallback?: string) => string;
  petsLoading: boolean;
  petsError: string | null;
  setPetsError: (v: string | null) => void;
  setPetsLoaded: (v: boolean) => void;
  loadPetsTab: () => void;
  pets: any[];
  onDeletePet: (id: string) => void;
  availabilityLoading: boolean;
  availabilityError: string | null;
  setAvailabilityError: (v: string | null) => void;
  setAvailabilityLoaded: (v: boolean) => void;
  loadAvailabilityTab: () => void;
  availability: Record<string, any> | null;
  profileData: any;
  profileBio?: string | null;
  reviewsLoading: boolean;
  reviewsError: string | null;
  setReviewsError: (v: string | null) => void;
  setReviewsLoaded: (v: boolean) => void;
  loadReviewsTab: () => void;
  reviewsUiItems: any[];
  router: any;
};

export function ProfileTabContent(props: Props) {
  const {
    activeTab,
    t,
    petsLoading,
    petsError,
    setPetsError,
    setPetsLoaded,
    loadPetsTab,
    pets,
    onDeletePet,
    availabilityLoading,
    availabilityError,
    setAvailabilityError,
    setAvailabilityLoaded,
    loadAvailabilityTab,
    availability,
    profileData,
    profileBio,
    reviewsLoading,
    reviewsError,
    setReviewsError,
    setReviewsLoaded,
    loadReviewsTab,
    reviewsUiItems,
    router,
  } = props;

  return (
    <>
      {activeTab === "pets" && (
        <>
          {petsLoading ? (
            <ProfilePetsTabSkeleton count={3} />
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
            <ProfilePetsTab
              pets={pets.map((pet) => {
                const parsed = parsePetNotes(pet.notes);
                return {
                  id: pet.id,
                  imageSource: petGalleryUrls(pet)[0] ?? "",
                  petName: pet.name || "Unnamed pet",
                  breed: pet.breed || "Unknown breed",
                  petType: pet.species || "Pet",
                  bio: parsed.bio || "No pet bio yet.",
                  yardType: ((pet as any)?.yard_type ?? parsed.yardType) || undefined,
                  ageRange: ((pet as any)?.age_range ?? parsed.ageRange) || undefined,
                  energyLevel:
                    ((pet as any)?.energy_level ?? parsed.energyLevel) || undefined,
                  seekingDateRange: pet.seekingDateRange,
                  seekingTime: pet.seekingTime,
                };
              })}
              onAddPet={() => {
                if (blockIfKycNotApproved()) return;
                router.push("/(private)/pets/add");
              }}
              showAddPetButton
              onPetPress={(id: string) => router.push(`/(private)/pets/${id}`)}
              showPetActions
              onLaunchRequest={(id: string) => {
                if (blockIfKycNotApproved()) return;
                router.push({
                  pathname: "/(private)/post-requests",
                  params: { petId: id },
                });
              }}
              onEditPet={(id: string) =>
                router.push({
                  pathname: "/(private)/pets/[id]/edit",
                  params: { id },
                })
              }
              onDeletePet={onDeletePet}
            />
          )}
        </>
      )}
      {activeTab === "availability" && (
        <>
          {availabilityLoading ? (
            <ProfileAvailabilityTabSkeleton />
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
          ) : (
            <ProfileAvailabilityTab
              data={{
                card: {
                  avatarUri: profileData.avatarUri,
                  name: profileData.name,
                  rating: profileData.rating,
                  handshakes: profileData.handshakes,
                  paws: profileData.paws,
                  isAvailable: availability?.available ?? false,
                  petTypes:
                    availability?.petKinds?.length > 0 ? (availability?.petKinds ?? []) : [],
                  services:
                    availability?.services?.length > 0 ? (availability?.services ?? []) : [],
                  location: profileData.location,
                },
                note: availability?.note || "",
                time:
                  availability?.startTime && availability?.endTime
                    ? `${availability.startTime} - ${availability.endTime}`
                    : "",
                days:
                  availability?.days?.length > 0 ? (availability?.days as string[]) : [],
                yardType: availability?.yardType || "",
                isPetOwner: availability?.petOwner || "",
              }}
              emptyMessage={t("profile.availability.emptyMine")}
            />
          )}
        </>
      )}
      {activeTab === "bio" && <ProfileBioTab bio={profileBio} isMine />}
      {activeTab === "reviews" && (
        <>
          {reviewsLoading ? (
            <ProfileReviewsTabSkeleton />
          ) : reviewsError ? (
            <ErrorState
              error={reviewsError}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => {
                setReviewsError(null);
                setReviewsLoaded(false);
                loadReviewsTab();
              }}
              mode="inline"
            />
          ) : (
            <ProfileReviewsTab
              rating={profileData.rating}
              handshakes={profileData.handshakes}
              paws={profileData.paws}
              items={reviewsUiItems}
              onReviewerPress={(id) =>
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id },
                })
              }
            />
          )}
        </>
      )}
    </>
  );
}
