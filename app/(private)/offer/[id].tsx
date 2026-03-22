import { Colors } from "@/src/constants/colors";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { Input } from "@/src/shared/components/ui/Input";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

/** Stub — replace with request/user fetch by id */
const MOCK = {
  ownerName: "Jane Ambers",
  ownerAvatar:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  petName: "Polo",
};

/**
 * Send a care offer / request to pet-sit (Figma ~801-22836).
 * Opened from request detail “Apply” or similar flows.
 */
export default function SendOfferScreen() {
  const { id: _id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [careTypes, setCareTypes] = useState<string[]>(["daytime"]);
  const [points, setPoints] = useState("25");
  const [message, setMessage] = useState("");

  const toggleCare = (key: string) => {
    setCareTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const onSend = () => {
    if (blockIfKycNotApproved()) return;
    // TODO: POST offer + navigate to chat / confirmation
    router.back();
  };

  return (
    <PageContainer>
      <BackHeader title={t("offer.title")} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.subtitle}>
          {t("offer.subtitle")}
        </AppText>

        <View
          style={[
            styles.recipientCard,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <AppImage
            source={{ uri: MOCK.ownerAvatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.recipientText}>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {t("offer.recipient")}
            </AppText>
            <AppText variant="title" style={styles.recipientName} numberOfLines={1}>
              {MOCK.ownerName}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} numberOfLines={1}>
              {t("offer.forPet", { name: MOCK.petName })}
            </AppText>
          </View>
        </View>

        <AppText variant="label" color={colors.onSurfaceVariant} style={styles.sectionLabel}>
          {t("filters.careType")}
        </AppText>
        <View style={styles.careBlock}>
          <CareTypeSelector
            selectedKeys={careTypes}
            onToggle={toggleCare}
            circleSize={56}
            iconSize={22}
          />
        </View>

        <Input
          label={t("offer.pointsLabel")}
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
          placeholder="25"
        />

        <Input
          label={t("offer.messageLabel")}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder={t("offer.messagePlaceholder")}
          inputStyle={styles.messageInput}
          containerStyle={styles.messageContainer}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t("offer.send")} onPress={onSend} fullWidth />
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  subtitle: {
    marginBottom: 4,
    lineHeight: 22,
  },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  recipientText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: -4,
  },
  careBlock: {
    marginBottom: 8,
  },
  messageContainer: {
    marginBottom: 0,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
});
