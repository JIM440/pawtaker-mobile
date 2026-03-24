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
import { MoreHorizontal } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";

const MOCK_PEER = {
  name: "Bob Majors",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
  location: "Lake Placid, New York, US",
  points: 58,
  handshakes: 12,
  paws: 17,
  rating: 4.1,
  currentTask: "Caring for Your Pet",
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
        <BackHeader
          title=""
          onBack={() => router.back()}
          rightSlot={
            <View style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
              <MoreHorizontal size={24} color={colors.onSurface} />
            </View>
          }
        />
        <View style={styles.successWrap}>
          <View style={{ width: "100%" }}>
            <ProfileHeader
              name={MOCK_PEER.name}
              avatarUri={MOCK_PEER.avatar}
              location={MOCK_PEER.location}
              points={MOCK_PEER.points}
              handshakes={MOCK_PEER.handshakes}
              paws={MOCK_PEER.paws}
              rating={MOCK_PEER.rating}
              currentTask={MOCK_PEER.currentTask}
              isAvailable
            />

            <View style={styles.staticStarsWrap} pointerEvents="none">
              <StarRatingInput
                value={rating}
                onChange={() => {}}
                size={28}
                maxStars={5}
                accessibilityLabel="Rating"
              />
            </View>

            <Input
              label={t("myCare.review.comment", "Review")}
              value={comment}
              onChangeText={() => {}}
              editable={false}
              multiline
              placeholder=""
              inputStyle={styles.commentInput}
              containerStyle={styles.commentContainer}
              showErrorOnlyAfterFocus={false}
            />

            <Button
              label={t("myCare.review.submit", "Submit")}
              onPress={() => router.back()}
              fullWidth
              style={styles.doneBtn}
            />
          </View>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackHeader
        title=""
        onBack={() => router.back()}
        rightSlot={
          <View style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
            <MoreHorizontal size={24} color={colors.onSurface} />
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={MOCK_PEER.name}
          avatarUri={MOCK_PEER.avatar}
          location={MOCK_PEER.location}
          points={MOCK_PEER.points}
          handshakes={MOCK_PEER.handshakes}
          paws={MOCK_PEER.paws}
          rating={MOCK_PEER.rating}
          currentTask={MOCK_PEER.currentTask}
          isAvailable
        />

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
  doneBtn: {
    marginTop: 8,
    width: "100%",
  },
  staticStarsWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
  },
});
