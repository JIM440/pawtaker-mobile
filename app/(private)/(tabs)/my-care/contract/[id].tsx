import { Colors } from "@/src/constants/colors";
import { useToastStore } from "@/src/lib/store/toast.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { EllipsisVertical } from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContractDetailScreen() {
  const {
    id,
    accepted: acceptedParam,
    mode,
    petName,
    breed,
    date,
    time,
    price,
  } = useLocalSearchParams<{
    id: string;
    accepted?: string;
    mode?: string;
    petName?: string;
    breed?: string;
    date?: string;
    time?: string;
    price?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showToast = useToastStore((s) => s.showToast);

  // Initialize accepted state from navigation params (so accepting from
  // the offer page immediately unlocks the agreement actions).
  const [accepted, setAccepted] = useState(
    () => acceptedParam === "1" || acceptedParam === "true",
  );
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

  const onAccept = () => {
    setShowAcceptConfirm(true);
  };

  const confirmAccept = () => {
    setShowAcceptConfirm(false);
    setAccepted(true);
    showToast({
      variant: "success",
      message: t("messages.agreementAccepted", "Agreement accepted"),
      durationMs: 3000,
    });
  };

  return (
    <PageContainer>
      <BackHeader
        title={t("myCare.contract.title")}
        onBack={() => router.back()}
        rightSlot={
          accepted ? (
            <TouchableOpacity
              onPress={() => setActionsOpen(true)}
              hitSlop={12}
              style={[
                styles.menuBtnTop,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <EllipsisVertical size={24} color={colors.onSurface} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant },
          ]}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.cardTitle}
          >
            {t("myCare.contract.title")}
          </AppText>

          {petName ? (
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.cardSub}
            >
              {mode === "seeking"
                ? t("messages.seekingForPet", { petName })
                : t("messages.applyingForPet", { petName })}
            </AppText>
          ) : (
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.cardSub}
            >
              {t("myCare.contract.idLabel", { id })}
            </AppText>
          )}

          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={styles.bodyText}
          >
            {accepted
              ? t("myCare.contract.agreementActive")
              : t("myCare.contract.acceptHint")}
          </AppText>

          {(breed || date || time || price) && (
            <View style={styles.requestSummary}>
              {breed ? (
                <AppText variant="caption" color={colors.onSurface}>
                  {breed}
                </AppText>
              ) : null}
              {date || time ? (
                <AppText
                  variant="caption"
                  color={colors.onSurfaceVariant}
                  style={styles.requestSummaryLine}
                >
                  {date ?? ""} {date && time ? "•" : ""} {time ?? ""}
                </AppText>
              ) : null}
              {price ? (
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {price}
                </AppText>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.sectionSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        {!accepted ? (
          <Button
            label={t("myCare.contract.acceptOffer")}
            onPress={onAccept}
            fullWidth
          />
        ) : null}
      </View>

      <FeedbackModal
        visible={showAcceptConfirm}
        title={t("myCare.contract.acceptConfirmTitle")}
        description={t("myCare.contract.acceptConfirmDescription")}
        primaryLabel={t("myCare.contract.acceptOffer")}
        secondaryLabel={t("common.cancel")}
        onPrimary={confirmAccept}
        onSecondary={() => setShowAcceptConfirm(false)}
        onRequestClose={() => setShowAcceptConfirm(false)}
      />

      <FeedbackModal
        visible={showBlockConfirm}
        title={t("messages.blockConfirmTitle")}
        description={t("messages.blockConfirmDescription")}
        primaryLabel={t("messages.block")}
        secondaryLabel={t("common.cancel")}
        destructive
        onPrimary={() => {
          setShowBlockConfirm(false);
          showToast({
            variant: "info",
            message: t("messages.blockedDemo"),
            durationMs: 3000,
          });
        }}
        onSecondary={() => setShowBlockConfirm(false)}
        onRequestClose={() => setShowBlockConfirm(false)}
      />

      <Modal
        transparent
        visible={actionsOpen}
        onRequestClose={() => setActionsOpen(false)}
        animationType="fade"
      >
        <Pressable
          style={styles.actionsOverlay}
          onPress={() => setActionsOpen(false)}
        >
          <View
            style={[
              styles.actionsCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.actionItem,
                pressed ? { opacity: 0.7 } : null,
              ]}
              onPress={() => {
                setActionsOpen(false);
                setAccepted(false);
                showToast({
                  variant: "info",
                  message: t("myCare.contract.terminatedDemo"),
                  durationMs: 3000,
                });
              }}
            >
              <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
                {t("myCare.contract.terminate")}
              </AppText>
            </Pressable>

            <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

            <Pressable
              style={({ pressed }) => [
                styles.actionItem,
                pressed ? { opacity: 0.7 } : null,
              ]}
              onPress={() => {
                setActionsOpen(false);
                setShowBlockConfirm(true);
              }}
            >
              <AppText variant="body" color={colors.error} numberOfLines={1}>
                {t("profile.blockUser")}
              </AppText>
            </Pressable>

            <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

            <Pressable
              style={({ pressed }) => [
                styles.actionItem,
                pressed ? { opacity: 0.7 } : null,
              ]}
              onPress={() => {
                setActionsOpen(false);
                router.push(
                  `/(private)/(tabs)/my-care/review/${id}` as any,
                );
              }}
            >
              <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
                {t("myCare.contract.rateAndReview")}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  cardTitle: { marginBottom: 2 },
  cardSub: { marginBottom: 4 },
  bodyText: { marginTop: 6 },
  requestSummary: { gap: 2, marginTop: 6 },
  requestSummaryLine: { marginTop: 2 },
  sectionSpacer: { height: 12 },
  footer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "transparent",
  },
  acceptRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  menuSpacer: { flex: 1 },
  menuBtnTop: {
    padding: 6,
    borderRadius: 999,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
    backgroundColor: "transparent",
  },
  actionsCard: {
    width: 172,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  actionItem: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: "center",
  },
  menuDivider: { height: 1, marginHorizontal: 12 },
});
