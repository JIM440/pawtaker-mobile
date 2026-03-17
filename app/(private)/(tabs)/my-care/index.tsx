import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { Handshake, PawPrint, Trophy } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { PageContainer } from '@/src/shared/components/layout';
import { MyCareSkeleton } from '@/src/shared/components/skeletons';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { ProfilePetCard } from '@/src/shared/components/cards/ProfilePetCard';

type TabId = 'given' | 'received' | 'liked';

const MOCK_IN_CARE = {
  petName: 'Polo',
  careType: 'Daytime',
  dayLabel: 'Day 1/5',
  caregiverName: 'Jane Ambers',
  caregiverAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
  endsIn: '2h 15m',
};

const MOCK_STATS = { points: 58, careGiven: 12, careReceived: 17 };

const MOCK_CARE_GIVEN_ROWS: Array<{
  id: string;
  ownerName: string;
  ownerAvatar: string;
  handshakes: number;
  paws: number;
  pet: string;
  careType: string;
  date: string;
}> = [
  {
    id: '1',
    ownerName: 'Jane Ambers',
    ownerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    handshakes: 12,
    paws: 17,
    pet: 'Polo',
    careType: 'Daytime',
    date: 'Mar 15, 2025',
  },
];

const MOCK_LIKED_PETS = [
  {
    id: '1',
    imageSource: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
    petName: 'Polo',
    breed: 'Golden Retriever',
    petType: 'Dog',
    bio: 'Friendly and loves long walks.',
    tags: ['Daytime', 'Play/walk'],
    seekingDateRange: 'Mar 20 – Mar 25',
    seekingTime: '8AM – 4PM',
  },
];

export default function MyCareScreen() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('given');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const onAvailableChange = (value: boolean) => {
    setAvailable(value);
    if (value) setShowSnackbar(true);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'given', label: 'Care Given' },
    { id: 'received', label: 'Care Received' },
    { id: 'liked', label: 'Liked' },
  ];

  if (loading) {
    return (
      <PageContainer scrollable={false} contentStyle={styles.pageContent}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MyCareSkeleton />
        </ScrollView>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false} contentStyle={styles.pageContent}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="title" style={styles.title}>My Care</AppText>
          <View style={styles.availableRow}>
            <AppText variant="body" color={colors.onSurface}>Available</AppText>
            <Switch
              value={available}
              onValueChange={onAvailableChange}
              trackColor={{ false: colors.surfaceContainer, true: colors.primaryContainer }}
              thumbColor={available ? colors.primary : colors.surfaceContainerLowest}
            />
          </View>
        </View>

        {/* In care card */}
        <View style={[styles.inCareCard, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={styles.inCareLabelRow}>
            <AppText variant="caption" color={colors.onSurfaceVariant}>In care</AppText>
          </View>
          <View style={styles.inCareMain}>
            <AppText variant="title" style={styles.inCarePetName}>{MOCK_IN_CARE.petName}</AppText>
            <View style={styles.inCareTags}>
              <View style={[styles.tag, { backgroundColor: colors.surfaceContainer }]}>
                <AppText variant="caption" color={colors.onSecondaryContainer}>{MOCK_IN_CARE.careType}</AppText>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.surfaceContainer }]}>
                <AppText variant="caption" color={colors.onSecondaryContainer}>{MOCK_IN_CARE.dayLabel}</AppText>
              </View>
            </View>
            <View style={styles.caregiverRow}>
              <AppImage
                source={{ uri: MOCK_IN_CARE.caregiverAvatar }}
                style={[styles.caregiverAvatar, { backgroundColor: colors.surfaceContainer }]}
                contentFit="cover"
              />
              <AppText variant="body" color={colors.onSurface}>{MOCK_IN_CARE.caregiverName}</AppText>
            </View>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              Ends in {MOCK_IN_CARE.endsIn}
            </AppText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Trophy size={20} color={colors.primary} />
            <AppText variant="title" color={colors.primary}>{String(MOCK_STATS.points).padStart(3, '0')}</AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>Points</AppText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Handshake size={20} color={colors.onSurface} />
            <AppText variant="title">{String(MOCK_STATS.careGiven).padStart(2, '0')}</AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>Care Given</AppText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest }]}>
            <PawPrint size={20} color={colors.onSurface} />
            <AppText variant="title">{String(MOCK_STATS.careReceived).padStart(2, '0')}</AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>Care Received</AppText>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: colors.outlineVariant }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab,
                activeTab === tab.id && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                },
              ]}
            >
              <AppText
                variant="body"
                color={activeTab === tab.id ? colors.primary : colors.onSurfaceVariant}
              >
                {tab.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'given' && (
          <CareGivenTab colors={colors} rows={MOCK_CARE_GIVEN_ROWS} />
        )}
        {activeTab === 'received' && (
          <CareReceivedTab colors={colors} />
        )}
        {activeTab === 'liked' && (
          <LikedTab colors={colors} pets={MOCK_LIKED_PETS} />
        )}
      </ScrollView>

      {showSnackbar && (
        <View style={[styles.snackbar, { backgroundColor: colors.primary }]}>
          <AppText variant="body" color={colors.onPrimary}>
            You are now tagged available
          </AppText>
        </View>
      )}
    </PageContainer>
  );
}

function CareGivenTab({
  colors,
  rows,
}: {
  colors: typeof Colors.light;
  rows: typeof MOCK_CARE_GIVEN_ROWS;
}) {
  if (rows.length === 0) {
    return (
      <View style={styles.emptyState}>
        <AppText variant="body" color={colors.onSurfaceVariant}>Nothing to show yet</AppText>
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.emptySub}>
          Start giving care to see your history here
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={[styles.tableHeader, { borderBottomColor: colors.outlineVariant }]}>
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colOwner}>Pet owner</AppText>
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colPet}>Pet</AppText>
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colType}>Care type</AppText>
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colDate}>Date</AppText>
      </View>
      {rows.map((row) => (
        <View key={row.id} style={[styles.tableRow, { borderBottomColor: colors.outlineVariant }]}>
          <View style={styles.colOwner}>
            <AppImage source={{ uri: row.ownerAvatar }} style={[styles.rowAvatar, { backgroundColor: colors.surfaceContainer }]} contentFit="cover" />
            <View style={styles.rowOwnerInfo}>
              <AppText variant="caption" numberOfLines={1}>{row.ownerName}</AppText>
              <View style={styles.badgesRow}>
                <Handshake size={10} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>{row.handshakes}</AppText>
                <PawPrint size={10} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>{row.paws}</AppText>
              </View>
            </View>
          </View>
          <AppText variant="caption" style={styles.colPet} numberOfLines={1}>{row.pet}</AppText>
          <AppText variant="caption" style={styles.colType} numberOfLines={1}>{row.careType}</AppText>
          <AppText variant="caption" style={styles.colDate} numberOfLines={1}>{row.date}</AppText>
        </View>
      ))}
    </View>
  );
}

function CareReceivedTab({ colors }: { colors: typeof Colors.light }) {
  return (
    <View style={styles.emptyState}>
      <AppText variant="body" color={colors.onSurfaceVariant}>Nothing to show yet</AppText>
      <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.emptySub}>
        Care you received will appear here
      </AppText>
    </View>
  );
}

function LikedTab({
  colors,
  pets,
}: {
  colors: typeof Colors.light;
  pets: Array<{
    id: string;
    imageSource: string;
    petName: string;
    breed: string;
    petType: string;
    bio: string;
    tags: string[];
    seekingDateRange: string;
    seekingTime: string;
  }>;
}) {
  return (
    <View style={styles.likedContent}>
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceContainerLowest }]}>
          <AppText variant="title" color={colors.primary}>058</AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}>Points</AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}>All time high 1200</AppText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceContainerLowest }]}>
          <AppText variant="title">012</AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}>Care Given</AppText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceContainerLowest }]}>
          <AppText variant="title">017</AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}>Care Received</AppText>
        </View>
      </View>
      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText variant="body" color={colors.onSurfaceVariant}>No liked pets yet</AppText>
        </View>
      ) : (
        <View style={styles.likedList}>
          {pets.map((pet) => (
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inCareCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  inCareLabelRow: {},
  inCareMain: {
    gap: 6,
  },
  inCarePetName: {
    fontSize: 18,
  },
  inCareTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  caregiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caregiverAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: -1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 4,
  },
  emptySub: {
    textAlign: 'center',
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  colOwner: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  colPet: {
    flex: 0.7,
    minWidth: 0,
  },
  colType: {
    flex: 0.8,
    minWidth: 0,
  },
  colDate: {
    flex: 0.8,
    minWidth: 0,
  },
  rowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rowOwnerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  likedContent: {
    gap: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    gap: 2,
  },
  likedList: {
    gap: 12,
  },
  snackbar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
