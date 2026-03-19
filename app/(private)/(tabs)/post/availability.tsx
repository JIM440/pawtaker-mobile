import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, Pencil } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { BackHeader } from '@/src/shared/components/layout/BackHeader';
import { StepProgress } from '@/src/shared/components/ui/StepProgress';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { Button } from '@/src/shared/components/ui/Button';
import { DateTimeField } from '@/src/shared/components/forms/DateTimeField';
import { TextField } from '@/src/shared/components/forms/TextField';

const TOTAL_STEPS = 8; // 7 steps + preview
const YARD_OPTIONS = [
  { id: 'fenced', labelKey: 'availability.yardFenced' as const },
  { id: 'high', labelKey: 'availability.yardHigh' as const },
  { id: 'none', labelKey: 'availability.yardNone' as const },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DEFAULT_DAYS_ACTIVE = [0, 6]; // Sunday and Saturday active per Figma

export default function AvailabilityWizardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);
  const [yardType, setYardType] = useState<string | null>(null);
  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>(DEFAULT_DAYS_ACTIVE);
  const progress = (step + 1) / TOTAL_STEPS;

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else {
      router.replace('/(private)/(tabs)');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackHeader
        title={t('availability.title')}
        onBack={goBack}
        rightSlot={<StepProgress progress={progress} width={120} />}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              {t('availability.careTitle')}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              {t('availability.careSubtitle')}
            </AppText>
            <View style={styles.chipRow}>
              {['Daytime', 'Play/walk', 'Overnight', 'Vacation'].map((label) => {
                const selected = careTypes.includes(label);
                return (
                  <TouchableOpacity
                    key={label}
                    activeOpacity={0.9}
                    onPress={() => {
                      setCareTypes((prev) =>
                        prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
                      );
                    }}
                    style={[
                      styles.careChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surfaceBright,
                        borderColor: selected ? colors.primary : colors.outlineVariant,
                      },
                    ]}
                  >
                    <AppText
                      variant="body"
                      color={selected ? colors.onPrimary : colors.onSurface}
                    >
                      {label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Tab 2: Choose your dates */}
        {step === 1 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              {t('availability.datesTitle')}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              {t('availability.datesSubtitle')}
            </AppText>
            <View style={styles.timeFieldsRow}>
              <DateTimeField
                mode="date"
                label={t('availability.startDate')}
                value={startDate}
                onChange={setStartDate}
                placeholder={t('availability.selectStart')}
              />
              <DateTimeField
                mode="date"
                label={t('availability.endDate')}
                value={endDate}
                onChange={setEndDate}
                placeholder={t('availability.selectEnd')}
              />
            </View>
          </>
        )}

        {/* Tab 3: What type of yard */}
        {step === 2 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              {t('availability.yardTitle')}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              {t('availability.yardSubtitle')}
            </AppText>
            <View style={styles.radioGroup}>
              {YARD_OPTIONS.map((opt) => {
                const selected = yardType === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setYardType(opt.id)}
                    style={[styles.radioRow, { borderBottomColor: colors.outlineVariant }]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: colors.outline },
                        selected && { borderColor: colors.primary, borderWidth: 2 },
                      ]}
                    >
                      {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                    <AppText variant="body" color={colors.onSurface}>{t(opt.labelKey)}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Tab 4: Which days (Sat & Sun active by default) */}
        {step === 3 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              {t('availability.daysTitle')}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              {t('availability.daysSubtitle')}
            </AppText>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((label, index) => {
                const selected = selectedDays.includes(index);
                return (
                  <TouchableOpacity
                    key={label}
                    activeOpacity={0.9}
                    onPress={() => toggleDay(index)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceBright,
                        borderColor: selected ? colors.primary : colors.outlineVariant,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={selected ? colors.onPrimary : colors.onSurface}
                      style={styles.dayChipText}
                    >
                      {label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              {t('availability.timeTitle')}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              {t('availability.timeSubtitle')}
            </AppText>
            <View style={styles.timeFieldsRow}>
              <DateTimeField
                mode="time"
                label={t('availability.startTime')}
                value={startTime}
                onChange={setStartTime}
                placeholder={t('availability.startTime')}
              />
              <DateTimeField
                mode="time"
                label={t('availability.endTime')}
                value={endTime}
                onChange={setEndTime}
                placeholder={t('availability.endTime')}
              />
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              {t('availability.locationTitle')}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              {t('availability.locationSubtitle')}
            </AppText>
            <TextField
              label={t('availability.locationLabel')}
              value={location}
              onChangeText={setLocation}
              placeholder={t('availability.locationPlaceholder')}
            />
            <TextField
              label={t('availability.notesLabel')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('availability.notesPlaceholder')}
            />
          </>
        )}

        {step === 6 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              Step 7: Availability details
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              (More preferences, etc.)
            </AppText>
            <View style={[styles.placeholderBox, { backgroundColor: colors.surfaceContainer }]}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                Content for step 7
              </AppText>
            </View>
          </>
        )}

        {step === 7 && (
          <>
            <AppText variant="title" color={colors.onSurface} style={styles.stepTitle}>
              {t('availability.previewTitle')}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              {t('availability.previewSubtitle')}
            </AppText>
            <View style={[styles.previewCard, { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant }]}>
              <View style={styles.previewProfileRow}>
                <AppImage
                  source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                  style={[styles.previewAvatar, { backgroundColor: colors.surfaceContainer }]}
                  contentFit="cover"
                />
                <View style={styles.previewProfileInfo}>
                  <AppText variant="title" color={colors.onSurface} style={styles.previewCardTitle}>
                    You&apos;re available to care
                  </AppText>
                  <AppText variant="body" color={colors.onSurfaceVariant} numberOfLines={2}>
                    {careTypes.length ? careTypes.join(', ') : 'Daytime, Play/walk'}
                  </AppText>
                </View>
              </View>
              <View style={[styles.previewMeta, { backgroundColor: colors.surfaceContainer }]}>
                <View style={[styles.previewMetaRow, { borderBottomColor: colors.outlineVariant }]}>
                  <View style={styles.previewIconSlot}>
                    <Calendar size={20} color={colors.primary} />
                  </View>
                  <AppText variant="body" color={colors.onSurface} style={styles.previewMetaText}>
                    {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} –{' '}
                    {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </AppText>
                </View>
                <View style={[styles.previewMetaRow, { borderBottomColor: colors.outlineVariant }]}>
                  <View style={styles.previewIconSlot}>
                    <Clock size={20} color={colors.primary} />
                  </View>
                  <AppText variant="body" color={colors.onSurface} style={styles.previewMetaText}>
                    {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} –{' '}
                    {endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </AppText>
                </View>
                <View style={[styles.previewMetaRow, { borderBottomColor: colors.outlineVariant }]}>
                  <View style={styles.previewIconSlot}>
                    <MapPin size={20} color={colors.primary} />
                  </View>
                  <AppText variant="body" color={colors.onSurface} style={styles.previewMetaText}>
                    {location.trim() || 'Lake Placid, NY'}
                  </AppText>
                </View>
                <View style={[styles.previewMetaRow, styles.previewMetaRowLast]}>
                  <View style={styles.previewLabelSlot}>
                    <AppText variant="caption" color={colors.onSurfaceVariant}>Days</AppText>
                  </View>
                  <AppText variant="body" color={colors.onSurface} style={styles.previewMetaText}>
                    {selectedDays.length ? selectedDays.map((d) => DAYS_OF_WEEK[d]).join(', ') : '—'}
                  </AppText>
                </View>
              </View>
              <View style={styles.previewFooterMeta}>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {t('availability.yardLabel')}: {yardType === 'fenced' ? t('availability.yardFenced') : yardType === 'high' ? t('availability.yardHigh') : yardType === 'none' ? t('availability.yardNone') : '—'}
                </AppText>
                {notes.trim() ? (
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.previewNotes}>
                    Notes: {notes.trim()}
                  </AppText>
                ) : null}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === TOTAL_STEPS - 1 ? t('availability.savePublish') : t('common.next')}
          onPress={goNext}
          style={styles.nextBtn}
          disabled={step === 0 && careTypes.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    marginBottom: 12,
    fontSize: 16,
  },
  stepSubtitle: {
    marginBottom: 16,
  },
  timeFieldsRow: {
    gap: 16,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  dayChipText: {
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  careChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: '47%',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  radioGroup: {
    gap: 0,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  placeholderBox: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
  },
  previewCardTitle: {
    marginBottom: 2,
  },
  previewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  previewProfileInfo: {
    flex: 1,
    gap: 2,
  },
  previewMeta: {
    padding: 12,
    borderRadius: 12,
    gap: 0,
    overflow: 'hidden',
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  previewMetaRowLast: {
    borderBottomWidth: 0,
  },
  previewMetaText: {
    flex: 1,
  },
  previewIconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabelSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFooterMeta: {
    marginTop: 4,
    gap: 4,
  },
  previewNotes: {
    marginTop: 2,
  },
  previewYard: {
    marginTop: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  nextBtn: {
    width: '100%',
  },
});
