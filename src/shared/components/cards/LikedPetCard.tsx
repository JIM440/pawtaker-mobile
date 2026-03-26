import type { ColorValues } from "@/src/constants/colors";
import { ProfilePetCard } from "./ProfilePetCard";
import { AppText } from "@/src/shared/components/ui/AppText";
import React, { useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export type LikedPetCardProps = {
  colors: ColorValues;
  imageSource: string | number | { uri: string };
  petName: string;
  breed: string;
  petType: string;
  dateRange: string;
  time: string;
  description: string;
  tags: string[];
  /** My Care → Liked: open overflow menu with Apply / Remove */
  onApply?: () => void;
  onRemove?: () => void;
  isSeeking?: boolean;
  /**
   * When false, only `ProfilePetCard` is shown (same visuals as liked tab, no modal).
   * Use on Profile pets tab so the row matches My Care liked rows.
   */
  showOverflowMenu?: boolean;
  /** Tapping the card (e.g. open pet detail) */
  onCardPress?: () => void;
};

export function LikedPetCard({
  colors,
  imageSource,
  petName,
  breed,
  petType,
  dateRange,
  time,
  description,
  tags,
  onApply = () => {},
  onRemove = () => {},
  isSeeking = false,
  showOverflowMenu = true,
  onCardPress,
}: LikedPetCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuBtnRef = useRef<View | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const handleOpenMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ x, y: y + height });
      setMenuVisible(true);
    });
  };

  const resolvedImage =
    typeof imageSource === "string" ? { uri: imageSource } : imageSource;

  return (
    <View>
      <ProfilePetCard
        imageSource={resolvedImage}
        petName={petName}
        breed={breed}
        petType={petType}
        bio={description}
        tags={tags}
        seekingDateRange={isSeeking ? dateRange : undefined}
        seekingTime={isSeeking ? time : undefined}
        onPress={onCardPress}
        onMenuPress={showOverflowMenu ? handleOpenMenu : undefined}
        menuButtonRef={
          showOverflowMenu
            ? (ref) => {
                menuBtnRef.current = ref;
              }
            : undefined
        }
      />

      {showOverflowMenu ? (
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View
              style={[
                styles.menuContent,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  top: menuPos.y + 30,
                  right: 20,
                },
              ]}
            >
              {isSeeking ? (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      onApply();
                    }}
                  >
                    <AppText variant="body">Apply</AppText>
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.menuDivider,
                      { backgroundColor: colors.outlineVariant },
                    ]}
                  />
                </>
              ) : null}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  onRemove();
                }}
              >
                <AppText variant="body" color={colors.error}>
                  Remove from Liked
                </AppText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  menuContent: {
    position: "absolute",
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuDivider: {
    height: 1,
  },
});
