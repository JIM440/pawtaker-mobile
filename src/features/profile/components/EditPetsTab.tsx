import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { ProfilePetCard } from "@/src/shared/components/cards";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

export type EditPet = {
  id: string;
  imageSource: string;
  petName: string;
  breed: string;
  petType: string;
  bio: string;
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
};

export function EditPetsTab({
  pets,
  onAddPet,
  onEditPet,
  onDeletePet,
  onLaunchPetRequest,
}: Props) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {pets.length === 0 ? (
        <View style={styles.empty}>
          <AppImage
            source={require("@/assets/illustrations/no-pet.svg")}
            type="svg"
            style={styles.emptyIllustration}
            height={145}
          />
          <AppText
            variant="body"
            color={colors.onSurface}
            style={styles.emptyTitle}
          >
            Uh oh!
          </AppText>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.emptySubtitle}
          >
            You have not uploaded any pets yet
          </AppText>
          <Button
            label="+ Add a pet"
            variant="outline"
            onPress={onAddPet}
            style={styles.addBtn}
          />
        </View>
      ) : (
        <>
          <Button
            label="+ Add a pet"
            variant="outline"
            onPress={onAddPet}
            style={styles.addBtn}
          />
          <View style={styles.list}>
            {pets.map((pet) => (
              <ProfilePetCard
                key={pet.id}
                imageSource={pet.imageSource}
                petName={pet.petName}
                breed={pet.breed}
                petType={pet.petType}
                bio={pet.bio}
                tags={pet.tags}
                seekingDateRange={pet.seekingDateRange}
                seekingTime={pet.seekingTime}
                onPress={() => onEditPet?.(pet.id)}
                onMenuPress={() => {
                  setOpenMenuForId(pet.id);
                }}
              />
            ))}
          </View>

          <Modal
            transparent
            visible={openMenuForId !== null}
            animationType="fade"
            onRequestClose={() => setOpenMenuForId(null)}
          >
            <Pressable
              style={styles.menuBackdrop}
              onPress={() => setOpenMenuForId(null)}
            >
              {openMenuForId && (
                <View style={styles.menuOverlay}>
                  <View
                    style={[
                      styles.menuContainer,
                      {
                        backgroundColor: colors.surfaceContainerLowest,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        const id = openMenuForId;
                        setOpenMenuForId(null);
                        if (id) onLaunchPetRequest?.(id);
                      }}
                    >
                      <AppText variant="body">Launch pet request</AppText>
                    </Pressable>
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        const id = openMenuForId;
                        setOpenMenuForId(null);
                        if (id) onEditPet?.(id);
                      }}
                    >
                      <AppText variant="body">Edit</AppText>
                    </Pressable>
                    <Pressable
                      style={styles.menuItem}
                      onPress={() => {
                        const id = openMenuForId;
                        setOpenMenuForId(null);
                        if (id) onDeletePet?.(id);
                      }}
                    >
                      <AppText variant="body" color={colors.error}>
                        Delete
                      </AppText>
                    </Pressable>
                  </View>
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
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 16,
  },
  emptySubtitle: {
    textAlign: "center",
  },
  menuBackdrop: {
    flex: 1,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 56,
    paddingRight: 16,
  },
  menuContainer: {
    minWidth: 200,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
