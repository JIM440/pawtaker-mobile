import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import { StarRatingInput } from "@/src/shared/components/ui/StarRatingInput";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

const MOCK_PEER = {
  name: "Bob Majors",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
};

/**
 * Create review after care (Figma ~989-33186 form, ~1029-29385 thank-you).
 */
export default function PostCareReviewScreen() {
  const { id: _id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = () => {
    if (rating < 1) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <PageContainer>
        <BackHeader title={t("myCare.review.title")} onBack={() => router.back()} />
        <View style={styles.successWrap}>
          <View
            style={[
              styles.successIcon,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <CheckCircle size={48} color={colors.primary} />
          </View>
          <AppText variant="title" style={styles.successTitle}>
            {t("myCare.review.successTitle")}
          </AppText>
          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={styles.successSubtitle}
          >
            {t("myCare.review.successSubtitle")}
          </AppText>
          <Button
            label={t("common.done", "Done")}
            onPress={() => router.back()}
            fullWidth
            style={styles.doneBtn}
          />
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackHeader title={t("myCare.review.title")} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.intro}>
          {t("myCare.review.intro")}
        </AppText>

        <View
          style={[
            styles.peerCard,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <AppImage
            source={{ uri: MOCK_PEER.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {t("myCare.review.reviewing")}
            </AppText>
            <AppText variant="title" numberOfLines={1} style={styles.peerName}>
              {MOCK_PEER.name}
            </AppText>
          </View>
        </View>

        <AppText variant="label" color={colors.onSurfaceVariant} style={styles.ratingLabel}>
          {t("myCare.review.rating")}
        </AppText>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          size={40}
          accessibilityLabel={t("myCare.review.rating")}
        />

        <Input
          label={t("myCare.review.comment")}
          value={comment}
          onChangeText={setComment}
          multiline
          placeholder={t("myCare.review.commentPlaceholder")}
          inputStyle={styles.commentInput}
          containerStyle={styles.commentContainer}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t("myCare.review.submit")}
          onPress={onSubmit}
          fullWidth
          disabled={rating < 1}
        />
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
  intro: {
    lineHeight: 22,
    marginBottom: 4,
  },
  peerCard: {
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
  peerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  ratingLabel: {
    marginTop: 8,
    marginBottom: 4,
  },
  commentContainer: {
    marginBottom: 0,
  },
  commentInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  successSubtitle: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  doneBtn: {
    marginTop: 8,
    width: "100%",
  },
});
