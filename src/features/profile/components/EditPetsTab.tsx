import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { ProfilePetCard } from "@/src/shared/components/cards";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { IllustratedEmptyState } from "@/src/shared/components/ui";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";

export type EditPet = {
  id: string;
  imageSource: string;
  petName: string;
  breed: string;
  petType: string;
  bio: string;
  yardType?: string | null;
  ageRange?: string | null;
  energyLevel?: string | null;
  tags?: string[];
  seekingDateRange?: string;
  seekingTime?: string;
};

type Props = {
  pets: EditPet[];
  onAddPet?: () => void;
  onEditPet?: (id: string) => void;
  onDeletePet?: (id: string) => void;
  onLaunchPetRequest?: (id: string) => void;
  onSave?: () => void;
};

export function EditPetsTab({
  pets,
  onAddPet,
  onEditPet,
  onDeletePet,
  onLaunchPetRequest,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

  return (
    <View style={styles.container}>
      {pets.length === 0 ? (
        <View style={styles.empty}>
          <IllustratedEmptyState
            title="Aw aw!"
            message="You have not uploaded any pets yet."
            illustration={{
              source: require("@/assets/illustrations/pets/no-pet.svg"),
              type: "svg",
              height: 145,
              width: 140,
              style: { backgroundColor: "transparent", borderRadius: 16 },
            }}
            actionLabel={t("post.request.addAPet", "+ Add a pet")}
            onAction={onAddPet}
          />
        </View>
      ) : (
        <>
          <View style={styles.topRow}>
            <Button
              label={t("post.request.addAPet", "+ Add a pet")}
              variant="outline"
              onPress={onAddPet}
              style={[styles.addBtn, { flex: 1 }]}
            />
          </View>
          <View style={styles.list}>
            {pets.map((pet) => (
              <ProfilePetCard
                key={pet.id}
                menuButtonRef={(el) => {
                  menuButtonRefs.current[pet.id] = el;
                }}
                imageSource={pet.imageSource}
                petName={pet.petName}
                breed={pet.breed}
                petType={pet.petType}
                bio={pet.bio}
                yardType={pet.yardType}
                ageRange={pet.ageRange}
                energyLevel={pet.energyLevel}
                tags={pet.tags}
                seekingDateRange={pet.seekingDateRange}
                seekingTime={pet.seekingTime}
                onPress={() => onEditPet?.(pet.id)}
                onMenuPress={() => {
                  const btn = menuButtonRefs.current[pet.id];
                  btn?.measureInWindow((x, y, width, height) => {
                    setMenuPosition({ x, y, width, height });
                    setOpenMenuForId(pet.id);
                  });
                }}
              />
            ))}
          </View>

          <Modal
            transparent
            visible={openMenuForId !== null}
            animationType="fade"
            onRequestClose={() => {
              setOpenMenuForId(null);
              setMenuPosition(null);
            }}
          >
            <Pressable
              style={styles.menuBackdrop}
              onPress={() => {
                setOpenMenuForId(null);
                setMenuPosition(null);
              }}
            >
              {openMenuForId && menuPosition && (
                <View
                  style={[
                    styles.menuContainer,
                    {
                      backgroundColor: colors.surfaceBright,
                      borderColor: colors.outlineVariant,
                      position: "absolute",
                      top: menuPosition.y + menuPosition.height + 30,
                      left: menuPosition.x - 180,
                    },
                  ]}
                >
                  <Pressable
                    style={{ ...styles.menuItem, borderBottomColor: colors.outlineVariant }}
                    onPress={() => {
                      const id = openMenuForId;
                      setOpenMenuForId(null);
                      setMenuPosition(null);
                      if (id) onLaunchPetRequest?.(id);
                    }}
                  >
                    <AppText variant="body">
                      {t("profile.pets.launchRequest", "Launch pet request")}
                    </AppText>
                  </Pressable>
                  <Pressable
                    style={{ ...styles.menuItem, borderBottomColor: colors.outlineVariant }}
                    onPress={() => {
                      const id = openMenuForId;
                      setOpenMenuForId(null);
                      setMenuPosition(null);
                      if (id) onEditPet?.(id);
                    }}
                  >
                    <AppText variant="body">{t("common.edit", "Edit")}</AppText>
                  </Pressable>
                  <Pressable
                    style={{ ...styles.menuItem, borderBottomWidth: 0 }}
                    onPress={() => {
                      const id = openMenuForId;
                      setOpenMenuForId(null);
                      setMenuPosition(null);
                      if (id) onDeletePet?.(id);
                    }}
                  >
                    <AppText variant="body" color={colors.error}>
                      {t("common.delete", "Delete")}
                    </AppText>
                  </Pressable>
                </View>
              )}
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  addBtn: {
    marginBottom: 0,
    marginTop: 16,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  saveBtn: {
    marginTop: 24,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  empty: {
    paddingVertical: 16,
  },
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  menuContainer: {
    minWidth: 200,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    overflow: "hidden",
    paddingVertical: 4,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
