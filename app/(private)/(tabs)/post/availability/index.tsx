import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { DateTimeField } from '@/src/shared/components/forms/DateTimeField';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppSwitch } from '@/src/shared/components/ui/AppSwitch';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';
import { CareTypeSelector } from '@/src/shared/components/ui/CareTypeSelector';
import { ChipSelector } from '@/src/shared/components/ui/ChipSelector';
import { DaySelector } from '@/src/shared/components/ui/DaySelector';
import { Input } from '@/src/shared/components/ui/Input';
import { useRouter } from 'expo-router';
import {
  Briefcase,
  ChevronLeft,
  Moon,
  PawPrint,
  Sun,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { PET_TYPE_OPTIONS } from '@/src/constants/pets';
import { PetKindSelector } from '@/src/shared/components/ui/PetKindSelector';

const TOTAL_STEPS = 8;

export default function AvailabilityWizardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);

  // Form State
  const [careTypes, setCareTypes] = useState<string[]>(['daytime', 'playwalk']);
  const [petKinds, setPetKinds] = useState<string[]>(['Dog', 'Cat']);
  const [yardType, setYardType] = useState('fenced yard');
  const [isPetOwner, setIsPetOwner] = useState('yes');
  const [days, setDays] = useState<string[]>(['Sa', 'Su']);
  const [startTime, setStartTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    return d;
  });
  const [note, setNote] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

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

  const toggleCareType = (key: string) => {
    setCareTypes((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const togglePetKind = (key: string) => {
    setPetKinds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleDay = (label: string) => {
    setDays((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHighest }]}>
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Care provider */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Care you will provide:</AppText>
            <View style={styles.careTypeWrapper}>
              <CareTypeSelector
                options={[
                  { key: 'daytime', label: 'Daytime', Icon: Sun },
                  { key: 'playwalk', label: 'Play/walk', Icon: PawPrint },
                  { key: 'overnight', label: 'Overnight', Icon: Moon },
                  { key: 'vacation', label: 'Vacation', Icon: Briefcase },
                ]}
                selectedKeys={careTypes}
                onToggle={toggleCareType}
                circleSize={90}
                iconSize={32}
              />
            </View>
          </View>
        )}

        {/* Step 2: Kind of pet */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>What kind of pet:</AppText>
            <PetKindSelector
              options={Array.from(PET_TYPE_OPTIONS)}
              selectedKeys={petKinds}
              onToggle={togglePetKind}
              variant="large"
            />
          </View>
        )}


        {/* Step 3: Type of yard */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Type of yard:</AppText>
            <ChipSelector
              options={['fenced yard', 'high fence', 'no yard']}
              selectedOption={yardType}
              onSelect={setYardType}
            />
          </View>
        )}

        {/* Step 4: Do you have a pet */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Do you have a pet?</AppText>
            <ChipSelector
              options={['yes', 'no']}
              selectedOption={isPetOwner}
              onSelect={setIsPetOwner}
            />
          </View>
        )}

        {/* Step 5: Day available */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Days available:</AppText>
            <DaySelector
              days={['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su']}
              selectedDays={days}
              onToggle={toggleDay}
            />
          </View>
        )}

        {/* Step 6: Time */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Set your available hours:</AppText>
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <DateTimeField
                  mode="time"
                  label="Start time"
                  value={startTime}
                  onChange={setStartTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DateTimeField
                  mode="time"
                  label="End time"
                  value={endTime}
                  onChange={setEndTime}
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 7: Add note */}
        {step === 6 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Add a short note:</AppText>
            <Input
              label="Bio / Experience"
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Tell others about your experience with pets..."
              inputStyle={styles.noteInput}
            />
          </View>
        )}

        {/* Step 8: Preview */}
        {step === 7 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Preview of your availability</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.previewSubtitle}>
              Tap on any item to edit it directly before publishing.
            </AppText>

            <View style={styles.directEditSection}>
              <View style={styles.availabilityRow}>
                <AppText variant="body" color={colors.onSurface} style={{ fontWeight: '600' }}>
                  Available to care
                </AppText>
                <AppSwitch value={isAvailable} onValueChange={setIsAvailable} />
              </View>

              <View style={styles.inlineCol}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
                  Care you provide:
                </AppText>
                <CareTypeSelector
                  options={[
                    { key: 'daytime', label: 'Daytime', Icon: Sun },
                    { key: 'playwalk', label: 'Play/walk', Icon: PawPrint },
                    { key: 'overnight', label: 'Overnight', Icon: Moon },
                    { key: 'vacation', label: 'Vacation', Icon: Briefcase },
                  ]}
                  selectedKeys={careTypes}
                  onToggle={toggleCareType}
                />
              </View>

              <View style={styles.inlineCol}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
                  Pet types:
                </AppText>
                <PetKindSelector
                  options={Array.from(PET_TYPE_OPTIONS)}
                  selectedKeys={petKinds}
                  onToggle={togglePetKind}
                  variant="small"
                />
              </View>

              <View style={styles.inlineCol}>
                <ChipSelector
                  label="Yard type:"
                  options={['fenced yard', 'high fence', 'no yard']}
                  selectedOption={yardType}
                  onSelect={setYardType}
                />
              </View>

              <View style={styles.inlineCol}>
                <ChipSelector
                  label="Pet owner:"
                  options={['yes', 'no']}
                  selectedOption={isPetOwner}
                  onSelect={setIsPetOwner}
                />
              </View>

              <View style={styles.inlineCol}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
                  Days:
                </AppText>
                <DaySelector
                  days={['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su']}
                  selectedDays={days}
                  onToggle={toggleDay}
                />
              </View>

              <View style={styles.inlineCol}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
                  Time:
                </AppText>
                <View style={styles.timeRow}>
                  <View style={{ flex: 1 }}>
                    <DateTimeField
                      mode="time"
                      label="Start"
                      value={startTime}
                      onChange={setStartTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DateTimeField
                      mode="time"
                      label="End"
                      value={endTime}
                      onChange={setEndTime}
                    />
                  </View>
                </View>
              </View>

              <Input
                label="Note"
                value={note}
                onChangeText={setNote}
                multiline
                inputStyle={styles.noteInputSmall}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === TOTAL_STEPS - 1 ? 'Publish Availability' : 'Next'}
          onPress={goNext}
          fullWidth
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
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  careTypeWrapper: {
    marginVertical: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  noteInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  previewSubtitle: {
    marginTop: -16,
    marginBottom: 8,
  },
  directEditSection: {
    gap: 24,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  inlineCol: {
    gap: 8,
  },
  fieldLabel: {
    fontWeight: '600',
  },
  noteInputSmall: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
});

