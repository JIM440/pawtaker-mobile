import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Clock, EllipsisVertical } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';

export type ProfilePetCardProps = {
  imageSource: string | number | { uri: string };
  petName: string;
  breed: string;
  petType: string;
  bio: string;
  tags?: string[];
  /** When set, show "Seeking" marker and date/time row */
  seekingDateRange?: string;
  seekingTime?: string;
  onPress?: () => void;
  onMenuPress?: () => void;
};

export function ProfilePetCard({
  imageSource,
  petName,
  breed,
  petType,
  bio,
  tags = [],
  seekingDateRange,
  seekingTime,
  onPress,
  onMenuPress,
}: ProfilePetCardProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showSeeking = seekingDateRange != null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surfaceContainerLowest ?? '#fffafa' }]}
    >
      <AppImage
        source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.nameRow}>
            <AppText variant="title" style={styles.petName}>{petName}</AppText>
            {showSeeking && (
              <View style={[styles.seekingMarker, { backgroundColor: colors.tertiaryContainer }]}>
                <AppText variant="caption" color={colors.onTertiaryContainer}>Seeking</AppText>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onMenuPress} hitSlop={8} style={styles.menuBtn}>
            <EllipsisVertical size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>
        <View style={styles.breedRow}>
          <AppText variant="caption" style={styles.breed}>{breed}</AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <AppText variant="caption" style={styles.breed}>{petType}</AppText>
        </View>
        {showSeeking && seekingDateRange && (
          <View style={styles.dateRow}>
            <Calendar size={16} color={colors.onSurface} />
            <AppText variant="caption" style={styles.metaText}>{seekingDateRange}</AppText>
            {seekingTime && (
              <>
                <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
                <Clock size={16} color={colors.onSurface} />
                <AppText variant="caption" style={styles.metaText}>{seekingTime}</AppText>
              </>
            )}
          </View>
        )}
        <AppText variant="caption" color={colors.onSurfaceVariant} numberOfLines={2} style={styles.bio}>
          {bio}
        </AppText>
        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: colors.surfaceContainer }]}
              >
                <AppText variant="caption" color={colors.onSecondaryContainer}>{tag}</AppText>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  petName: {
    fontSize: 16,
    letterSpacing: -0.1,
  },
  seekingMarker: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuBtn: {
    padding: 4,
  },
  breedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breed: {
    fontSize: 11,
    lineHeight: 13,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  bio: {
    fontSize: 12,
    lineHeight: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
