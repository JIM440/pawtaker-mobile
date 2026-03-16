import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Bell, Search, SlidersHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { PageContainer } from '@/src/shared/components/layout';
import { AppText } from '@/src/shared/components/ui/AppText';
import { PetCard } from '@/src/shared/components/cards';

const MOCK_REQUESTS = [
  {
    id: '1',
    imageSource: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    petName: 'Polo',
    breed: 'Golden Retriever',
    petType: 'Dog',
    dateRange: 'Mar 14-18',
    time: '8am-4pm',
    careType: 'Daytime',
    location: 'B-871 13th Ave, Campbell River, BC',
    distance: '10km',
    description:
      'Polo is a friendly, high-energy Golden Retriever who thrives on activity. He is well-trained, loves long walks, and is a fetch enthusiast. Polo is great with people and looking for a companion who can keep up with his love for the outdoors!',
    caretaker: {
      name: 'Jane Ambers',
      rating: 4.1,
      reviewsCount: 12,
      petsCount: 17,
    },
    isFavorite: false,
  },
  {
    id: '2',
    imageSource: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    petName: 'Polo',
    breed: 'Golden Retriever',
    petType: 'Dog',
    dateRange: 'Mar 14-18',
    time: '8am-4pm',
    careType: 'Daytime',
    location: 'B-871 13th Ave, Campbell River, BC',
    distance: '10km',
    description:
      'Polo is a friendly, high-energy Golden Retriever who thrives on activity. He is well-trained, loves long walks, and is a fetch enthusiast.',
    caretaker: {
      name: 'Jane Ambers',
      rating: 4.1,
      reviewsCount: 12,
      petsCount: 17,
    },
    isFavorite: true,
  },
];

type FilterTab = 'all' | 'requests' | 'takers';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [filter, setFilter] = useState<FilterTab>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['2']));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <PageContainer scrollable edges={['top', 'left', 'right']}>
      {/* Header: PawTaker + Notifications */}
      <View className="flex-row items-center justify-between pb-3">
        <AppText variant="headline" style={{ fontSize: 22, letterSpacing: -0.1 }}>
          {t('app.name')}
        </AppText>
        <TouchableOpacity className="relative pr-3" hitSlop={12}>
          <Bell size={24} color={colors.onSurface} />
          <View className="absolute -top-0.5 right-1 min-w-[12px] h-[12px] rounded-full items-center justify-center px-1" style={{ backgroundColor: colors.primary }}>
            <AppText variant="caption" color={colors.onPrimary} style={{ fontSize: 10, lineHeight: 12 }}>
              5
            </AppText>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search + filter icon */}
      <View className="flex-row items-center gap-2 mb-2.5">
        <View className="flex-1 h-12 rounded-full flex-row items-center pl-5 pr-3 gap-2" style={{ backgroundColor: colors.surfaceContainer }}>
          <Search size={20} color={colors.onSurfaceVariant} />
          <TextInput
            className="flex-1 text-xs py-3"
            style={{ color: colors.onSurface }}
            placeholder="Search location, care type, pet type..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surfaceContainer }}
          hitSlop={8}
        >
          <SlidersHorizontal size={18} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <View className="flex-row flex-wrap gap-1.5 mb-2">
        {(['all', 'requests', 'takers'] as const).map((tab) => {
          const active = filter === tab;
          const label = tab === 'all' ? 'All' : tab === 'requests' ? 'Requests' : 'Takers';
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              className="px-3 py-2 rounded-full"
              style={
                active
                  ? { backgroundColor: colors.surfaceContainer }
                  : { borderWidth: 1, borderColor: colors.outlineVariant }
              }
            >
              <AppText
                variant="caption"
                color={active ? colors.onSecondaryContainer : colors.onSurfaceVariant}
              >
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section title */}
      <View className="flex-row items-center gap-2 mb-2">
        <AppText variant="title" style={{ fontSize: 16, letterSpacing: -0.1 }}>Requests near you:</AppText>
        <AppText variant="caption" color={colors.onSurfaceVariant}>
          {MOCK_REQUESTS.length} pets in your area
        </AppText>
      </View>

      {/* Pet cards list */}
      <FlatList
        data={MOCK_REQUESTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
        renderItem={({ item }) => (
          <PetCard
            imageSource={item.imageSource}
            petName={item.petName}
            breed={item.breed}
            petType={item.petType}
            dateRange={item.dateRange}
            time={item.time}
            careType={item.careType}
            location={item.location}
            distance={item.distance}
            description={item.description}
            caretaker={item.caretaker}
            isFavorite={favorites.has(item.id)}
            onFavorite={() => toggleFavorite(item.id)}
            onApply={() => router.push(`/requests/${item.id}`)}
          />
        )}
      />
    </PageContainer>
  );
}
