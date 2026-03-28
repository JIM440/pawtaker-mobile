import React from "react";
import { View } from "react-native";
import { PetCardBase } from "./PetCardBase";

export type ProfilePetCardProps = {
  imageSource: string | number | { uri: string };
  petName: string;
  breed: string;
  petType: string;
  bio: string;
  /** Shown as tonal chips (yard / age / energy from parsed pet notes). */
  yardType?: string | null;
  ageRange?: string | null;
  energyLevel?: string | null;
  tags?: string[];
  /** When set, show "Seeking" marker and date/time row */
  seekingDateRange?: string;
  seekingTime?: string;
  onPress?: () => void;
  onMenuPress?: () => void;
  menuButtonRef?: (ref: View | null) => void;
  /** Hide ⋯ when viewing another user’s pets list. */
  showMenu?: boolean;
};

export function ProfilePetCard({
  imageSource,
  petName,
  breed,
  petType,
  bio,
  yardType,
  ageRange,
  energyLevel,
  tags = [],
  seekingDateRange,
  seekingTime,
  onPress,
  onMenuPress,
  menuButtonRef,
  showMenu = true,
}: ProfilePetCardProps) {
  return (
    <PetCardBase
      imageSource={imageSource}
      petName={petName}
      breed={breed}
      petType={petType}
      bio={bio}
      yardType={yardType}
      ageRange={ageRange}
      energyLevel={energyLevel}
      tags={tags}
      seekingDateRange={seekingDateRange}
      seekingTime={seekingTime}
      onPress={onPress}
      onMenuPress={onMenuPress}
      menuButtonRef={menuButtonRef}
      showMenu={showMenu}
    />
  );
}
