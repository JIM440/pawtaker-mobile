import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  Settings,
  MapPin,
  Activity,
  Handshake,
  PawPrint,
  Star,
  BadgeCheck,
} from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { PageContainer } from '@/src/shared/components/layout';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { ProfilePetCard } from '@/src/shared/components/cards';

const PROFILE = {
  avatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  name: 'Jane Ambers',
  location: 'Lake Placid, New York, US',
  points: 58,
  handshakes: 12,
  paws: 17,
  rating: 4.1,
  currentTask: 'Caring for Bob Majors',
};

const MOCK_PETS = [
  {
    id: '1',
    imageSource: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200',
    petName: 'Polo',
    breed: 'Golden Retriever',
    petType: 'Dog',
    bio: "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch. He's well-trained.",
    tags: ['fenced yard', 'high energy', '1-3yrs'],
    seekingDateRange: 'Mar 14-Apr 02',
    seekingTime: '8am-4pm',
  },
  {
    id: '2',
    imageSource: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200',
    petName: 'Bobby',
    breed: 'Tabby',
    petType: 'Cat',
    bio: 'Bobby is an independent and affectionate tabby cat. He enjoys her alone time but also loves cuddles.',
    tags: ['indoors only', 'calm', '1-3yrs'],
  },
];

type ProfileTab = 'pets' | 'availability' | 'bio' | 'reviews';

export default function ProfileScreen() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [activeTab, setActiveTab] = useState<ProfileTab>('pets');
  const hasPets = MOCK_PETS.length > 0;

  return (
    <PageContainer scrollable edges={['top', 'left', 'right']}>
      {/* Header: Profile + Edit Profile + Settings */}
      <View style={styles.header}>
        <AppText variant="headline" style={styles.title}>Profile</AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/(private)/(tabs)/profile/edit')} hitSlop={8}>
            <AppText variant="body" color={colors.primary} style={styles.editLink}>
              Edit Profile
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(private)/settings')} hitSlop={12} style={styles.settingsBtn}>
            <Settings size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile head: avatar, Available, name, location, stats */}
      <View style={styles.profileHead}>
        <View style={styles.avatarWrap}>
          <AppImage
            source={{ uri: PROFILE.avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={[styles.onlineBadge, { backgroundColor: colors.primary }]} />
        </View>
        <View style={[styles.availablePill, { backgroundColor: colors.tertiaryContainer }]}>
          <AppText variant="caption" color={colors.onTertiaryContainer}>Available</AppText>
        </View>
        <View style={styles.nameRow}>
          <AppText variant="headline" style={styles.userName}>{PROFILE.name}</AppText>
          <BadgeCheck size={20} color={colors.primary} />
        </View>
        <View style={styles.locationRow}>
          <MapPin size={20} color={colors.onSurfaceVariant} />
          <AppText variant="caption" color={colors.onSurfaceVariant}>{PROFILE.location}</AppText>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: colors.surfaceContainer }]}>
            <Activity size={14} color={colors.onSurfaceVariant} />
            <AppText variant="caption" color={colors.onSurfaceVariant}>{PROFILE.points} Points</AppText>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.surfaceContainer }]}>
            <View style={[styles.statInner, { backgroundColor: colors.tertiaryContainer, borderColor: colors.outlineVariant }]}>
              <Handshake size={12} color={colors.tertiary} />
              <AppText variant="caption" color={colors.onTertiaryContainer}>{PROFILE.handshakes}</AppText>
            </View>
            <View style={[styles.statInner, { backgroundColor: colors.primaryContainer, borderColor: colors.outlineVariant }]}>
              <PawPrint size={12} color={colors.onPrimaryContainer} />
              <AppText variant="caption" color={colors.onPrimaryContainer}>{PROFILE.paws}</AppText>
            </View>
          </View>
          <View style={[styles.statPill, { backgroundColor: colors.surfaceContainer }]}>
            <AppText variant="caption" color={colors.onSurfaceVariant}>{PROFILE.rating}</AppText>
            <Star size={12} color={colors.onSurfaceVariant} fill={colors.onSurfaceVariant} />
          </View>
        </View>
        <View style={[styles.currentTaskPill, { backgroundColor: colors.surfaceContainer }]}>
          <AppText variant="caption" color={colors.onSurfaceVariant}>{PROFILE.currentTask}</AppText>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.outlineVariant }]}>
        {[
          { key: 'pets' as const, label: 'Your Pets' },
          { key: 'availability' as const, label: 'Availability' },
          { key: 'bio' as const, label: 'Short Bio' },
          { key: 'reviews' as const, label: 'Reviews' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key)}
            style={[styles.tab, activeTab === key && styles.tabActive]}
          >
            <AppText
              variant="label"
              color={activeTab === key ? colors.primary : colors.onSurfaceVariant}
              style={activeTab === key ? styles.tabLabelActive : undefined}
            >
              {label}
            </AppText>
            {activeTab === key && (
              <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'pets' && (
        <>
          {hasPets ? (
            <View style={styles.petList}>
              {MOCK_PETS.map((pet) => (
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
                  onPress={() => {}}
                  onMenuPress={() => {}}
                />
              ))}
              <Button
                label="+ Add a pet"
                variant="outline"
                onPress={() => router.push('/(private)/pets/add')}
                style={styles.addPetBtn}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIllustration, { backgroundColor: colors.surfaceContainer }]} />
              <AppText variant="body" style={styles.emptyMessage}>
                Uh oh! This user has not uploaded any pets yet
              </AppText>
              <Button
                label="+ Add a pet"
                variant="outline"
                onPress={() => router.push('/(private)/pets/add')}
                style={styles.addPetBtn}
              />
            </View>
          )}
        </>
      )}
      {activeTab === 'availability' && (
        <View style={styles.placeholder}>
          <AppText variant="body" color={colors.onSurfaceVariant}>Availability</AppText>
        </View>
      )}
      {activeTab === 'bio' && (
        <View style={styles.placeholder}>
          <AppText variant="body" color={colors.onSurfaceVariant}>Short Bio</AppText>
        </View>
      )}
      {activeTab === 'reviews' && (
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeaderRow}>
            <View style={styles.reviewsScore}>
              <AppText variant="headline" style={styles.reviewsScoreValue}>
                {PROFILE.rating.toFixed(1)}
              </AppText>
              <View style={styles.reviewsScoreMeta}>
                <Star size={16} color={colors.primary} fill={colors.primary} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  out of 5
                </AppText>
              </View>
            </View>
            <View style={styles.reviewsStats}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {PROFILE.handshakes} Care Given
              </AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {PROFILE.paws} Care Received
              </AppText>
            </View>
          </View>
          <View style={styles.reviewsList}>
            <View style={[styles.reviewCard, { backgroundColor: colors.surfaceContainerLowest }]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar} />
                <View style={styles.reviewTitleCol}>
                  <AppText variant="label">Bob Majors</AppText>
                  <View style={styles.reviewMetaRow}>
                    <Star size={12} color={colors.primary} fill={colors.primary} />
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      4.5 • Daytime
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  2d ago
                </AppText>
              </View>
              <AppText
                variant="body"
                color={colors.onSurfaceVariant}
                style={styles.reviewBody}
              >
                Jane took incredible care of Polo. Lots of photo updates and clear communication.
                Came home to a very happy pup!
              </AppText>
            </View>
          </View>
        </View>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  editLink: {
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  settingsBtn: {
    padding: 4,
  },
  profileHead: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
  },
  onlineBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  availablePill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  currentTaskPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  tabActive: {},
  tabLabelActive: {
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
  petList: {
    gap: 8,
    paddingBottom: 24,
  },
  addPetBtn: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIllustration: {
    width: 140,
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: 16,
  },
  placeholder: {
    paddingVertical: 24,
  },
  reviewsSection: {
    paddingVertical: 16,
    gap: 12,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewsScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsScoreValue: {
    fontSize: 24,
  },
  reviewsScoreMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewsStats: {
    alignItems: 'flex-end',
    gap: 2,
  },
  reviewsList: {
    gap: 8,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  reviewTitleCol: {
    flex: 1,
    gap: 2,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewBody: {
    fontSize: 12,
    lineHeight: 16,
  },
});
