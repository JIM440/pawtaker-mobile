import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Clock, MapPin } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

// Mock data for a pet - in real app, fetch by id
const MOCK_PET = {
  id: "1",
  images: [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800",
  ],
  name: "Polo",
  breed: "Golden Retriever",
  type: "Dog",
  bio: "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch. He's well-trained and great with kids and other pets. He thrives on attention and loves to be around people.",
  tags: ["fenced yard", "high energy", "1-3yrs"],
  seekingDateRange: "Mar 14-Apr 02",
  seekingTime: "8am-4pm",
  location: "Lake Placid, New York, US",
  specialNeeds: "None",
  caretaker: {
    id: "u1",
    name: "Jane Ambers",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  }
};

export default function PetDetailScreen() {
  const { id: _petId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const pet = MOCK_PET; // Use id to fetch real data

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      <BackHeader title={pet.name} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Gallery - Simple Swiper-like display */}
        <View style={styles.imageContainer}>
          <AppImage
            source={{ uri: pet.images[0] }}
            style={styles.mainImage}
            contentFit="cover"
          />
          {pet.images.length > 1 && (
            <View style={styles.imageBadge}>
              <AppText variant="caption" color="#fff">1/{pet.images.length}</AppText>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <AppText variant="headline" style={styles.petName}>{pet.name}</AppText>
              <AppText variant="body" color={colors.onSurfaceVariant}>{pet.breed} • {pet.type}</AppText>
            </View>
            <View style={[styles.seekingPill, { backgroundColor: colors.tertiaryContainer }]}>
              <AppText variant="caption" color={colors.onTertiaryContainer}>{t("pet.detail.seeking")}</AppText>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" color={colors.onSurfaceVariant}>{pet.seekingDateRange}</AppText>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" color={colors.onSurfaceVariant}>{pet.seekingTime}</AppText>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.onSurfaceVariant} />
            <AppText variant="caption" color={colors.onSurfaceVariant}>{pet.location}</AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="title" style={styles.sectionTitle}>{t("pet.detail.about", { name: pet.name })}</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.bio}>
              {pet.bio}
            </AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="label" color={colors.onSurfaceVariant} style={styles.sectionLabel}>{t("pet.detail.attributes")}</AppText>
            <View style={styles.tagsContainer}>
              {pet.tags.map(tag => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <AppText variant="caption" color={colors.onSurface}>{tag}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="label" color={colors.onSurfaceVariant} style={styles.sectionLabel}>{t("pet.detail.specialNeeds")}</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant}>{pet.specialNeeds}</AppText>
          </View>

          {/* Caretaker Info */}
          <View style={[styles.caretakerCard, { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant }]}>
            <AppImage source={{ uri: pet.caretaker.avatar }} style={styles.caretakerAvatar} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>{t("pet.detail.petOwner")}</AppText>
              <AppText variant="body" style={{ fontWeight: '600' }}>{pet.caretaker.name}</AppText>
            </View>
            <Button
              label={t("common.viewProfile")}
              variant="outline"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id: pet.caretaker.id },
                })
              }
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t("pet.detail.helpWithPet")} fullWidth onPress={() => { }} />
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
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  petName: {
    fontSize: 28,
    marginBottom: 4,
  },
  seekingPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  sectionLabel: {
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
  bio: {
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  caretakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 12,
  },
  caretakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  }
});
