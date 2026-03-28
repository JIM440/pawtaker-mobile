import { Colors } from "@/src/constants/colors";
import { ProfilePetCard } from "@/src/shared/components/cards/ProfilePetCard";
import {
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
import { Button } from "@/src/shared/components/ui/Button";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";

export type ProfilePet = {
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
  pets: ProfilePet[];
  onAddPet?: () => void;
  showAddPetButton?: boolean;
  onPetPress?: (petId: string) => void;
  /**
   * Show ⋯ with Launch / Edit / Delete. Defaults to `showAddPetButton` (own profile).
   */
  showPetActions?: boolean;
  onLaunchRequest?: (petId: string) => void;
  onEditPet?: (petId: string) => void;
  onDeletePet?: (petId: string) => void;
};

export function ProfilePetsTab({
  pets,
  onAddPet,
  showAddPetButton = true,
  onPetPress,
  showPetActions,
  onLaunchRequest,
  onEditPet,
  onDeletePet,
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const hasPets = pets.length > 0;

  const actionsEnabled = showPetActions ?? showAddPetButton;

  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const menuButtonRefs = React.useRef<Record<string, View | null>>({});

  const menuPet = useMemo(
    () => (openMenuForId ? pets.find((p) => p.id === openMenuForId) : null),
    [openMenuForId, pets],
  );

  const canLaunchRequest = Boolean(menuPet && !menuPet.seekingDateRange);

  if (!hasPets) {
    const title = t("post.request.emptyPetsTitle");
    const message = showAddPetButton
      ? t("post.request.emptyPetsSubtitle")
      : t("profile.pets.emptyOtherUser");
    return (
      <View style={styles.emptyState}>
        <IllustratedEmptyState
          title={title}
          message={message}
          illustration={IllustratedEmptyStateIllustrations.noPet}
          actionLabel={
            showAddPetButton && onAddPet
              ? t("post.request.addAPet", "+ Add a pet")
              : undefined
          }
          onAction={showAddPetButton ? onAddPet : undefined}
        />
      </View>
    );
  }

  return (
    <View style={styles.petList}>
      {showAddPetButton && onAddPet && (
        <Button
          label={t("post.request.addAPet")}
          variant="outline"
          onPress={onAddPet}
          style={styles.addPetBtn}
        />
      )}
      <View style={styles.petListContainer}>
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
            tags={pet.tags ?? []}
            seekingDateRange={pet.seekingDateRange}
            seekingTime={pet.seekingTime}
            showMenu={actionsEnabled}
            onPress={() => onPetPress?.(pet.id)}
            onMenuPress={
              actionsEnabled
                ? () => {
                    const btn = menuButtonRefs.current[pet.id];
                    btn?.measureInWindow((x, y, width, height) => {
                      setMenuPosition({ x, y, width, height });
                      setOpenMenuForId(pet.id);
                    });
                  }
                : undefined
            }
          />
        ))}
      </View>

      {actionsEnabled ? (
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
                    top: menuPosition.y + menuPosition.height + 8,
                    left: Math.max(16, menuPosition.x - 160),
                  },
                ]}
              >
                {canLaunchRequest ? (
                  <Pressable
                    style={{
                      ...styles.menuItem,
                      borderBottomColor: colors.outlineVariant,
                    }}
                    onPress={() => {
                      const id = openMenuForId;
                      setOpenMenuForId(null);
                      setMenuPosition(null);
                      if (id) onLaunchRequest?.(id);
                    }}
                  >
                    <AppText variant="body">
                      {t("profile.pets.launchRequest")}
                    </AppText>
                  </Pressable>
                ) : null}
                <Pressable
                  style={{
                    ...styles.menuItem,
                    borderBottomColor: colors.outlineVariant,
                    borderBottomWidth: onDeletePet ? 1 : 0,
                  }}
                  onPress={() => {
                    const id = openMenuForId;
                    setOpenMenuForId(null);
                    setMenuPosition(null);
                    if (id) onEditPet?.(id);
                  }}
                >
                  <AppText variant="body">{t("common.edit")}</AppText>
                </Pressable>
                {onDeletePet ? (
                  <Pressable
                    style={{ ...styles.menuItem, borderBottomWidth: 0 }}
                    onPress={() => {
                      const id = openMenuForId;
                      setOpenMenuForId(null);
                      setMenuPosition(null);
                      if (id) onDeletePet(id);
                    }}
                  >
                    <AppText variant="body" color={colors.error}>
                      {t("common.delete")}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            )}
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  petList: {
    gap: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  petListContainer: {
    gap: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  addPetBtn: {
    gap: 8,
    borderWidth: 0,
  },
  emptyState: {
    paddingVertical: 16,
    paddingHorizontal: 8,
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
    borderBottomWidth: 0,
  },
});
