import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Clock, MapPin, Pencil } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { Button } from '@/src/shared/components/ui/Button';
import { DateTimeField } from '@/src/shared/components/forms/DateTimeField';

const TOTAL_STEPS = 8; // 7 steps + preview
const YARD_OPTIONS = [
  { id: 'fenced', label: 'Fenced yard' },
  { id: 'high', label: 'High Fence' },
  { id: 'none', label: 'No yard' },
];

export default function AvailabilityWizardScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);
  const [yardType, setYardType] = useState<string | null>(null);
  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const progress = (step + 1) / TOTAL_STEPS;

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
            <AppText variant="title" style={styles.stepTitle}>
              What care can you offer?
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.stepSubtitle}>
              Select the types of care you're available to provide (e.g. Daytime, Play/walk).
            </AppText>
            <View style={styles.chipRow}>
              {['Daytime', 'Play/walk', 'Overnight', 'Vacation'].map((label) => {
                const selected = careTypes.includes(label);
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => {
                      setCareTypes((prev) =>
                        prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
                      );
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surfaceContainer },
                      selected && { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <AppText
                      variant="body"
                      color={selected ? colors.onPrimaryContainer : colors.onSurface}
                    >
                      {label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>
              What type of yard do you have?
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
                    <AppText variant="body">{opt.label}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>
              Choose your dates
            </AppText>
            <DateTimeField
              mode="date"
              label="Start date"
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start"
            />
            <DateTimeField
              mode="date"
              label="End date"
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end"
            />
          </>
        )}

        {step === 3 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>
              Choose your daily hours
            </AppText>
            <DateTimeField
              mode="time"
              label="Start time"
              value={startTime}
              onChange={setStartTime}
              placeholder="Start"
            />
            <DateTimeField
              mode="time"
              label="End time"
              value={endTime}
              onChange={setEndTime}
              placeholder="End"
            />
          </>
        )}

        {step >= 4 && step <= 6 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>
              Step {step + 1}: Availability details
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              (Location, preferences, notes, etc.)
            </AppText>
            <View style={[styles.placeholderBox, { backgroundColor: colors.surfaceContainer }]}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                Content for step {step + 1}
              </AppText>
            </View>
          </>
        )}

        {step === 7 && (
          <>
            <AppText variant="title" style={styles.stepTitle}>
              Preview: Your availability
            </AppText>
            <View style={[styles.previewCard, { backgroundColor: colors.surfaceContainerLowest }]}>
              <View style={styles.previewProfileRow}>
                <AppImage
                  source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
                  style={styles.previewAvatar}
                  contentFit="cover"
                />
                <View style={styles.previewProfileInfo}>
                  <AppText variant="title">You're available to care</AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    {careTypes.length ? careTypes.join(', ') : 'Daytime, Play/walk'}
                  </AppText>
                </View>
              </View>
              <View style={[styles.previewMeta, { backgroundColor: colors.surfaceContainer }]}>
                <View style={styles.previewMetaRow}>
                  <Calendar size={18} color={colors.onSurface} />
                  <AppText variant="body">
                    {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
                  </AppText>
                  <TouchableOpacity><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
                </View>
                <View style={styles.previewMetaRow}>
                  <Clock size={18} color={colors.onSurface} />
                  <AppText variant="body">
                    {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} –{' '}
                    {endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </AppText>
                  <TouchableOpacity><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
                </View>
                <View style={styles.previewMetaRow}>
                  <MapPin size={18} color={colors.onSurface} />
                  <AppText variant="body">Lake Placid, NY</AppText>
                  <TouchableOpacity><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
                </View>
              </View>
              <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.previewYard}>
                Yard: {yardType === 'fenced' ? 'Fenced yard' : yardType === 'high' ? 'High Fence' : 'No yard'}
              </AppText>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === TOTAL_STEPS - 1 ? 'Save & Publish' : 'Next'}
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
    marginBottom: 12,
    fontSize: 16,
  },
  stepSubtitle: {
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    backgroundColor: '#eee',
  },
  previewProfileInfo: {
    flex: 1,
    gap: 2,
  },
  previewMeta: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
