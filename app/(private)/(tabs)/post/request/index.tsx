import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Sun,
  Moon,
  Activity,
  Briefcase,
  Lightbulb,
  Calendar,
  Clock,
  MapPin,
  Pencil,
} from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { Button } from '@/src/shared/components/ui/Button';
import { DateTimeField } from '@/src/shared/components/forms/DateTimeField';

const TOTAL_STEPS = 5;
const CARE_TYPES = [
  { id: 'daytime', label: 'Daytime', icon: Sun },
  { id: 'playwalk', label: 'Play/walk', icon: Activity },
  { id: 'overnight', label: 'Overnight', icon: Moon },
  { id: 'vacation', label: 'Vacation', icon: Briefcase },
] as const;

const HINTS = [
  'Daytime: Full-day care while you\'re away',
  'Play/walk: Quick visits for fun exercises/breaks',
  'Overnight: A cozy 1 or 2 night sleepover',
  'Vacation: Extended care for your long trips away',
];

const MOCK_PETS = [
  { id: '1', name: 'Polo', imageUri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200' },
];

export default function LaunchRequestWizardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);
  const [careType, setCareType] = useState<string | null>('daytime');
  const [multiDay, setMultiDay] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [timeStart, setTimeStart] = useState<Date>(new Date());
  const [timeEnd, setTimeEnd] = useState<Date>(new Date());
  const progress = (step + 1) / TOTAL_STEPS;

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else {
      // Launch
      router.replace('/(private)/(tabs)');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={[styles.progressTrack, { backgroundColor: colors.tertiaryContainer }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>What type of care do you need?</AppText>
            <View style={styles.careRow}>
              {CARE_TYPES.map((c) => {
                const Icon = c.icon;
                const selected = careType === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCareType(c.id)}
                    style={[
                      styles.careOption,
                      { backgroundColor: colors.surfaceVariant },
                      selected && { borderWidth: 3, borderColor: colors.primary },
                    ]}
                  >
                    <Icon
                      size={24}
                      color={selected ? colors.primary : colors.onSurfaceVariant}
                    />
                    <AppText
                      variant="caption"
                      color={selected ? colors.primary : colors.onSurfaceVariant}
                      style={styles.careLabel}
                    >
                      {c.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.hintsBox, { backgroundColor: colors.surfaceContainerLowest }]}>
              <View style={styles.hintsTitleRow}>
                <View style={[styles.lightbulbWrap, { backgroundColor: colors.tertiaryContainer }]}>
                  <Lightbulb size={24} color={colors.onTertiaryContainer} />
                </View>
                <AppText variant="title" color={colors.onTertiaryContainer}>Hints</AppText>
              </View>
              {HINTS.map((line, i) => (
                <AppText key={i} variant="body" color={colors.onSurfaceVariant} style={styles.hintLine}>
                  {line}
                </AppText>
              ))}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>{t('post.request.selectPet')}</AppText>
            <View style={styles.petGrid}>
              {MOCK_PETS.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[styles.petTile, { backgroundColor: colors.surfaceContainer }]}
                >
                  <AppImage
                    source={{ uri: pet.imageUri }}
                    style={[styles.petTileImage, { backgroundColor: colors.surfaceContainer }]}
                    contentFit="cover"
                  />
                  <AppText variant="caption" numberOfLines={1}>{pet.name}</AppText>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.petTileAdd, { borderColor: colors.outlineVariant }]}
              >
                <AppText variant="body" color={colors.onSurfaceVariant}>+ Add pet</AppText>
              </TouchableOpacity>
            </View>
            <Button label={t('post.request.addPet')} variant="outline" onPress={() => {}} style={styles.addPetBtn} />
          </>
        )}

        {step === 2 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>Select date</AppText>
            <View style={[styles.switchRow, { backgroundColor: colors.surfaceContainer }]}>
              <AppText variant="body" color={colors.onSurface}>
                {t('post.request.multiDay')}
              </AppText>
              <Switch
                value={multiDay}
                onValueChange={setMultiDay}
                trackColor={{ false: colors.surfaceContainer, true: colors.primaryContainer }}
                thumbColor={multiDay ? colors.primary : colors.surfaceContainerLowest}
              />
            </View>
            <DateTimeField
              mode="date"
              label={t('post.request.date')}
              value={date}
              onChange={setDate}
              placeholder={t('post.request.selectDatePlaceholder')}
            />
            <View style={styles.timeRow}>
              <DateTimeField
                mode="time"
                label={t('post.request.startTime')}
                value={timeStart}
                onChange={setTimeStart}
                placeholder={t('availability.startTime')}
              />
              <DateTimeField
                mode="time"
                label={t('post.request.endTime')}
                value={timeEnd}
                onChange={setTimeEnd}
                placeholder={t('availability.endTime')}
              />
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>{t('post.request.detailsTitle')}</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.detailHint}>
              {t('post.request.detailsHint')}
            </AppText>
            <View style={[styles.detailPills, { backgroundColor: colors.surfaceContainer }]}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>fenced yard • 3-8 yrs • medium energy</AppText>
            </View>
            <View style={[styles.specialNeedsBox, { borderColor: colors.outlineVariant }]}>
              <AppText variant="body" color={colors.onSurfaceVariant}>
                Special needs (e.g. medication, diet)…
              </AppText>
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>Preview of your request</AppText>
            <View style={[styles.previewCard, { backgroundColor: colors.surfaceContainerLowest }]}>
              <AppImage
                source={{ uri: MOCK_PETS[0].imageUri }}
                style={[styles.previewImage, { backgroundColor: colors.surfaceContainer }]}
                contentFit="cover"
              />
              <View style={styles.previewBody}>
                <View style={styles.previewNameRow}>
                  <AppText variant="title">{MOCK_PETS[0].name}</AppText>
                  <TouchableOpacity><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
                </View>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  Golden Retriever • Dog
                </AppText>
                <View style={styles.previewMeta}>
                  <MapPin size={14} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    Lake Placid, New York, US
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.onSurfaceVariant} numberOfLines={2}>
                  Polo is a friendly and energetic golden retriever who loves long walks…
                </AppText>
                <View style={styles.previewDetails}>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    Details: fenced yard • 3-8 yrs • medium energy
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    Special needs: Needs insulin twice a day. Shy around loud noises.
                  </AppText>
                </View>
                <View style={styles.previewProfileRow}>
                  <View style={styles.previewProfile}>
                    <AppImage
                      source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }}
                      style={[styles.previewAvatar, { backgroundColor: colors.surfaceContainer }]}
                      contentFit="cover"
                    />
                    <AppText variant="caption">Jane Ambers</AppText>
                  </View>
                  <TouchableOpacity><AppText variant="body" color={colors.primary}>View Profile</AppText></TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.previewDateRow}>
              <Calendar size={18} color={colors.onSurface} />
              <AppText variant="body">{dateText} – Mar 18</AppText>
              <TouchableOpacity><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
            </View>
            <View style={styles.previewDateRow}>
              <Clock size={18} color={colors.onSurface} />
              <AppText variant="body">{timeStart} – {timeEnd}</AppText>
              <TouchableOpacity><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
            </View>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.disclaimer}>
              By tapping Launch, you approve that anyone in the community can apply or contact you in our chat system.
            </AppText>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === TOTAL_STEPS - 1 ? 'Launch' : 'Next'}
          onPress={goNext}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    marginBottom: 16,
    fontSize: 16,
  },
  careRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  careOption: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  careLabel: {
    fontSize: 12,
  },
  hintsBox: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  hintsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lightbulbWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintLine: {
    fontSize: 12,
    lineHeight: 16,
  },
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  petTile: {
    width: 100,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    gap: 4,
  },
  petTileImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  petTileAdd: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPetBtn: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateTimeField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  calendarPlaceholder: {
    height: 280,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHint: {
    marginBottom: 12,
  },
  detailPills: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  specialNeedsBox: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  previewBody: {
    padding: 16,
    gap: 4,
  },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewDetails: {
    marginTop: 8,
    gap: 4,
  },
  previewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  previewProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  previewDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  disclaimer: {
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  nextBtn: {
    width: '100%',
  },
});
