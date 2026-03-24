import { Colors } from "@/src/constants/colors";
import { EditAvailabilityTab } from "@/src/features/profile/components/EditAvailabilityTab";
import { EditDetailsTab } from "@/src/features/profile/components/EditDetailsTab";
import { EditPetsTab } from "@/src/features/profile/components/EditPetsTab";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useRouter } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

type EditTab = "details" | "pets" | "availability";

const MOCK_PETS = [
  {
    id: "1",
    imageSource:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200",
    petName: "Polo",
    breed: "Golden Retriever",
    petType: "Dog",
    bio: "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch.",
    tags: ["fenced yard", "high energy", "1-3yrs"],
    seekingDateRange: "Mar 14-Apr 02",
    seekingTime: "8am-4pm",
  },
  {
    id: "2",
    imageSource:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200",
    petName: "Bobby",
    breed: "Tabby",
    petType: "Cat",
    bio: "Bobby is an independent and affectionate tabby cat.",
    tags: ["indoors only", "calm", "1-3yrs"],
  },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [activeTab, setActiveTab] = useState<EditTab>("details");
  const [showDiscard, setShowDiscard] = useState(false);

  // Form state
  const [avatarUri] = useState(
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  );
  const [username, setUsername] = useState("Jane Ambers");
  const [bio, setBio] = useState(
    "I own a golden retriever. His name is Polo. I love him so much. Then I have Bobby a very cunning and smart cat",
  );
  const [zipCode, setZipCode] = useState("00501");
  const [location, setLocation] = useState("Lake Placid, New York, US");

  const initialValues = useRef({ username, bio, zipCode, location });

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

  const handleSave = () => {
    // TODO: persist profile changes
    router.back();
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
              // TODO: image picker
            }}
            onSave={handleSave}
          />
        )}
        {activeTab === "pets" && (
          <EditPetsTab
            pets={MOCK_PETS}
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
          <EditAvailabilityTab onSave={handleSave} />
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
