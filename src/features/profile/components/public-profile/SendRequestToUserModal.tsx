import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import {
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/feedback/IllustratedEmptyState";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
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
  loading?: boolean;
  sendRequestBusy: boolean;
  t: (key: string, options?: any, fallback?: string) => string;
  onClose: () => void;
  onSelectPet: (pet: any) => void;
  onSend: () => void;
  onAddRequest?: () => void;
  onAddPet?: () => void;
};

export function SendRequestToUserModal({
  visible,
  colors,
  styles,
  userPets,
  selectedSeekingPet,
  petSendSubtitleById,
  sendingToName,
  loading = false,
  sendRequestBusy,
  t,
  onClose,
  onSelectPet,
  onSend,
  onAddRequest,
  onAddPet: _onAddPet,
}: Props) {
  const requestablePets = userPets.filter((pet: any) => Boolean(petSendSubtitleById[pet.id]));

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
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <View key={`skeleton-${index}`} style={styles.sendRequestPetRow}>
                      <Skeleton width={18} height={18} borderRadius={999} />
                      <Skeleton width={32} height={32} borderRadius={999} />
                      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                        <Skeleton height={14} width="48%" borderRadius={4} />
                        <Skeleton height={12} width="78%" borderRadius={4} />
                      </View>
                    </View>
                  ))
                ) : requestablePets.length === 0 ? (
                  <IllustratedEmptyState
                    title={
                      t(
                        "post.request.emptyPetsTitle",
                        "No pets found",
                      )
                    }
                    message={
                      t(
                        "home.sendRequest.noEligiblePetsMessage",
                        "You don’t have any pets with an active seeking request right now.",
                      )
                    }
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
                  disabled={sendRequestBusy || loading}
                  style={styles.sendRequestActionBtn}
                />
                <Button
                  label={t("common.sendRequest", "Send request")}
                  variant="primary"
                  fullWidth={false}
                  onPress={onSend}
                  disabled={!selectedSeekingPet || sendRequestBusy || loading}
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
