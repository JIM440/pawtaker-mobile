import { Colors } from '@/src/constants/colors';
import { useLocationSearch, type NearbyRequest, type NearbyTaker, type SearchMode } from '@/src/features/search/hooks/useLocationSearch';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const RADIUS_OPTIONS = [
  { label: 'Nearby', value: 10 },
  { label: 'Close', value: 25 },
  { label: 'Wide', value: 50 },
  { label: 'Anywhere', value: 150 },
];

export default function SearchScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [mode, setMode] = useState<SearchMode>('takers');
  const [radiusKm, setRadiusKm] = useState(50);

  const {
    takers,
    requests,
    loading,
    error,
    hasLocation,
    searchTakers,
    searchRequests,
  } = useLocationSearch();

  useEffect(() => {
    if (!hasLocation) return;
    if (mode === 'takers') {
      void searchTakers({ radiusKm });
    } else {
      void searchRequests({ radiusKm });
    }
  }, [mode, radiusKm, hasLocation]);

  if (!hasLocation) {
    return <NoLocationPrompt colors={colors} />;
  }

  const results = mode === 'takers' ? takers : requests;
  const isEmpty = !loading && results.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <AppText variant="headline" color={colors.onSurface} style={styles.title}>
          {t('search.title', 'Search')}
        </AppText>

        {/* Mode toggle */}
        <View style={[styles.modeRow, { backgroundColor: colors.surfaceContainerHigh }]}>
          {(['takers', 'requests'] as SearchMode[]).map((m) => (
            <Pressable
              key={m}
              style={[
                styles.modeBtn,
                mode === m && { backgroundColor: colors.primary },
              ]}
              onPress={() => setMode(m)}
            >
              <AppText
                variant="body"
                color={mode === m ? colors.onPrimary : colors.onSurfaceVariant}
                style={styles.modeBtnText}
              >
                {m === 'takers' ? t('search.takers', 'Takers') : t('search.requests', 'Requests')}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Radius selector */}
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.radiusChip,
                {
                  backgroundColor:
                    radiusKm === opt.value ? colors.primaryContainer : colors.surfaceContainerHigh,
                  borderColor:
                    radiusKm === opt.value ? colors.primary : colors.outline,
                },
              ]}
              onPress={() => setRadiusKm(opt.value)}
            >
              <AppText
                variant="caption"
                color={radiusKm === opt.value ? colors.onPrimaryContainer : colors.onSurfaceVariant}
              >
                {opt.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AppText variant="body" color={colors.error} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isEmpty && (
            <View style={styles.emptyState}>
              <AppText variant="body" color={colors.onSurfaceVariant} style={styles.emptyText}>
                {t('search.noResults', 'No results nearby.')}
              </AppText>
              {radiusKm < 150 && (
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.emptyHint}>
                  {t('search.tryWider', 'Try a wider radius?')}
                </AppText>
              )}
            </View>
          )}

          {mode === 'takers' &&
            (takers as NearbyTaker[]).map((taker) => (
              <TakerCard key={taker.user_id} taker={taker} colors={colors} />
            ))}

          {mode === 'requests' &&
            (requests as NearbyRequest[]).map((req) => (
              <RequestCard key={req.request_id} request={req} colors={colors} />
            ))}
        </ScrollView>
      )}
    </View>
  );
}

function TakerCard({ taker, colors }: { taker: NearbyTaker; colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
      <View style={styles.cardRow}>
        {taker.avatar_url ? (
          <AppImage
            source={{ uri: taker.avatar_url }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.surfaceContainerHighest }]} />
        )}
        <View style={styles.cardInfo}>
          <AppText variant="body" color={colors.onSurface} style={styles.cardName}>
            {taker.full_name ?? 'Unknown'}
          </AppText>
          {taker.city ? (
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {taker.city}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.distanceBadge, { backgroundColor: colors.primaryContainer }]}>
          <AppText variant="caption" color={colors.onPrimaryContainer}>
            {taker.distance_km} km
          </AppText>
        </View>
      </View>
      {taker.bio ? (
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.cardBio}
          numberOfLines={2}
        >
          {taker.bio}
        </AppText>
      ) : null}
    </View>
  );
}

function RequestCard({ request, colors }: { request: NearbyRequest; colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
      <View style={styles.cardRow}>
        {request.owner_avatar ? (
          <AppImage
            source={{ uri: request.owner_avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.surfaceContainerHighest }]} />
        )}
        <View style={styles.cardInfo}>
          <AppText variant="body" color={colors.onSurface} style={styles.cardName}>
            {request.pet_name} ({request.pet_species})
          </AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}>
            {request.care_type} · {request.start_date}
            {request.end_date !== request.start_date ? ` → ${request.end_date}` : ''}
          </AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}>
            {request.owner_city ?? ''}
          </AppText>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.distanceBadge, { backgroundColor: colors.primaryContainer }]}>
            <AppText variant="caption" color={colors.onPrimaryContainer}>
              {request.distance_km} km
            </AppText>
          </View>
          <AppText variant="caption" color={colors.primary} style={styles.pointsBadge}>
            {request.points_offered} pts
          </AppText>
        </View>
      </View>
    </View>
  );
}

function NoLocationPrompt({ colors }: { colors: any }) {
  const router = useRouter();
  return (
    <View style={[styles.screen, styles.centered, { backgroundColor: colors.background }]}>
      <View style={[styles.noLocationCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
        <AppText variant="title" color={colors.onSurface} style={styles.noLocationTitle}>
          Set your location
        </AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.noLocationBody}>
          To find takers and requests near you, please add your city in your profile.
        </AppText>
        <Button
          label="Update Location"
          onPress={() => router.push('/(private)/(tabs)/profile/edit' as any)}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { marginBottom: 0 },
  modeRow: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeBtnText: {
    fontWeight: '600',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: { textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { textAlign: 'center' },
  emptyHint: { textAlign: 'center' },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {},
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontWeight: '600' },
  cardBio: { lineHeight: 18 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pointsBadge: { fontWeight: '600' },
  noLocationCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  noLocationTitle: { textAlign: 'center' },
  noLocationBody: { textAlign: 'center', lineHeight: 22 },
});
