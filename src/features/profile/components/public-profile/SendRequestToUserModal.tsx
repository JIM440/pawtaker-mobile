import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import {
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/feedback/IllustratedEmptyState";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import React from "react";
import { Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

type Props = {
  visible: boolean;
  colors: Record<string, string>;
  styles: any;
  userPets: any[];
  selectedSeekingPet: any | null;
  petSendSubtitleById: Record<string, string>;
  sendingToName: string;
  sendRequestBusy: boolean;
  t: (key: string, options?: any, fallback?: string) => string;
  onClose: () => void;
  onSelectPet: (pet: any) => void;
  onSend: () => void;
  onAddRequest?: () => void;
};

export function SendRequestToUserModal({
  visible,
  colors,
  styles,
  userPets,
  selectedSeekingPet,
  petSendSubtitleById,
  sendingToName,
  sendRequestBusy,
  t,
  onClose,
  onSelectPet,
  onSend,
  onAddRequest,
}: Props) {
  const requestablePets = userPets.filter((pet: any) =>
    Boolean(petSendSubtitleById[pet.id]),
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sendRequestOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sendRequestCard,
                {
                  backgroundColor: colors.surfaceBright,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <AppText variant="title" color={colors.onSurface} style={styles.sendRequestTitle}>
                {t("home.sendRequest.selectPetTitle", "Select Pet")}
              </AppText>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sendRequestListContent}
              >
                {requestablePets.length === 0 ? (
                  <IllustratedEmptyState
                    title={t(
                      "home.sendRequest.noOpenRequestTitle",
                      "No open request yet",
                    )}
                    message={t(
                      "home.sendRequest.noOpenRequestMessage",
                      "Create a care request for one of your pets before sending.",
                    )}
                    illustration={IllustratedEmptyStateIllustrations.noPet}
                    actionLabel={t("home.sendRequest.addRequest", "Add request")}
                    onAction={onAddRequest}
                    mode="inline"
                  />
                ) : (
                  requestablePets.map((pet: any) => {
                    const selected = selectedSeekingPet?.id === pet.id;
                    const subtitle =
                      petSendSubtitleById[pet.id] || `${pet.species || "Pet"} · ${pet.breed || "—"}`;
                    const uri = petGalleryUrls(pet)[0] ?? "";
                    return (
                      <TouchableOpacity
                        key={pet.id}
                        activeOpacity={0.9}
                        onPress={() => onSelectPet(pet)}
                        style={styles.sendRequestPetRow}
                      >
                        <View
                          style={[
                            styles.sendRequestRadioOuter,
                            {
                              borderColor: selected ? colors.primary : colors.outlineVariant,
                            },
                          ]}
                        >
                          {selected ? (
                            <View
                              style={[
                                styles.sendRequestRadioInner,
                                { backgroundColor: colors.primary },
                              ]}
                            />
                          ) : null}
                        </View>
                        {uri ? (
                          <AppImage
                            source={{ uri }}
                            style={styles.sendRequestPetThumb}
                            contentFit="cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <View
                            style={[
                              styles.sendRequestPetThumb,
                              {
                                backgroundColor: colors.surfaceContainerHighest,
                              },
                            ]}
                          />
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <AppText
                            variant="headline"
                            color={colors.onSurface}
                            style={styles.sendRequestPetName}
                            numberOfLines={1}
                          >
                            {pet.name}
                          </AppText>
                          <AppText
                            variant="caption"
                            color={colors.onSurfaceVariant}
                            numberOfLines={2}
                            style={styles.sendRequestPetMeta}
                          >
                            {subtitle}
                          </AppText>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.sendRequestSendingTo}
              >
                {t("home.sendRequest.sendingTo", {
                  name: sendingToName || t("common.user", "User"),
                })}
              </AppText>

              <View style={styles.sendRequestActions}>
                <Button
                  label={t("common.cancel", "Cancel")}
                  variant="outline"
                  fullWidth={false}
                  onPress={onClose}
                  disabled={sendRequestBusy}
                  style={styles.sendRequestActionBtn}
                />
                <Button
                  label={t("common.sendRequest", "Send request")}
                  variant="primary"
                  fullWidth={false}
                  onPress={onSend}
                  disabled={!selectedSeekingPet || sendRequestBusy}
                  loading={sendRequestBusy}
                  style={styles.sendRequestActionBtn}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
