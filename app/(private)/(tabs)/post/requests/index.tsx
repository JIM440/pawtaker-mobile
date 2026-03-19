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
  Lightbulb,
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

const TOTAL_STEPS = 5;

const CARE_TYPE_OPTIONS = [
  { key: 'daytime', label: 'Daytime', Icon: Sun },
  { key: 'playwalk', label: 'Play/walk', Icon: PawPrint },
  { key: 'overnight', label: 'Overnight', Icon: Moon },
  { key: 'vacation', label: 'Vacation', Icon: Briefcase },
];

const HINTS = [
  { label: 'Daytime', text: 'Full-day care while you\'re away' },
  { label: 'Play/walk', text: 'Quick visits for fun exercises/breaks' },
  { label: 'Overnight', text: 'A cozy 1 or 2 night sleepover' },
  { label: 'Vacation', text: 'Extended care for your long trips away' },
];

const MOCK_PETS = [
  { id: '1', name: 'Polo', imageUri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200' },
  { id: '2', name: 'Luna', imageUri: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200' },
  { id: '3', name: 'Bobby', imageUri: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200' },
];

export default function LaunchRequestWizardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);
  const [careType, setCareType] = useState<string>('daytime');
  const [multiDay, setMultiDay] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [timeStart, setTimeStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [timeEnd, setTimeEnd] = useState<Date>(() => {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return d;
  });
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [yardType, setYardType] = useState('fenced yard');
  const [ageRange, setAgeRange] = useState('3-8 yrs');
  const [energyLevel, setEnergyLevel] = useState('medium energy');
  const [days, setDays] = useState<string[]>(['Sa', 'Su']);
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
    setCareType(key);
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
        {step === 0 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>What type of care do you need?</AppText>
            <View style={styles.careTypeWrapper}>
              <CareTypeSelector
                options={CARE_TYPE_OPTIONS}
                selectedKeys={[careType]}
                onToggle={toggleCareType}
                circleSize={90}
                iconSize={32}
              />
            </View>
            <View style={[styles.hintsBox, { backgroundColor: colors.surfaceContainerLowest }]}>
              <View style={styles.hintsTitleRow}>
                <View style={[styles.lightbulbWrap, { backgroundColor: colors.tertiaryContainer }]}>
                  <Lightbulb size={24} color={colors.onTertiaryContainer} />
                </View>
                <AppText variant="title" color={colors.onTertiaryContainer} style={{ fontWeight: '600' }}>Hints</AppText>
              </View>
              {HINTS.map((hint, i) => (
                <AppText key={i} variant="body" color={colors.onSurfaceVariant} style={styles.hintLine}>
                  <AppText variant="body" style={{ fontWeight: '600' }}>{hint.label}:</AppText> {hint.text}
                </AppText>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Select pet</AppText>
            {MOCK_PETS.length > 0 ? (
              <View style={styles.petGrid}>
                {MOCK_PETS.map((pet) => {
                  const isSelected = selectedPet === pet.id;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      onPress={() => setSelectedPet(pet.id)}
                      style={[styles.petTile]}
                    >
                      <View style={[
                        styles.petTileImageWrapper,
                        { borderColor: isSelected ? colors.primary : 'transparent', borderWidth: 2 }
                      ]}>
                        <AppImage
                          source={{ uri: pet.imageUri }}
                          style={styles.petTileImage}
                          contentFit="cover"
                        />
                      </View>
                      <AppText variant="caption" style={[styles.petName, { color: isSelected ? colors.primary : colors.onSurface }]}>
                        {pet.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.petTileAdd]}
                >
                  <View style={[styles.petTileAddCircle, { borderColor: colors.outlineVariant }]}>
                    <AppText variant="title" color={colors.onSurfaceVariant}>+</AppText>
                  </View>
                  <AppText variant="caption" color={colors.primary} style={styles.petName}>or add another pet</AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <AppImage
                  source={require('@/assets/illustrations/no-pet.svg')}
                  type="svg"
                  width={200}
                  height={150}
                  style={styles.emptyIllustration}
                />
                <AppText variant="title" style={styles.emptyTitle}>Uh oh!</AppText>
                <AppText variant="body" color={colors.onSurfaceVariant} style={styles.emptySubtitle}>
                  You have not uploaded any pets yet
                </AppText>
                <Button
                  label="Add a pet"
                  variant="outline"
                  onPress={() => { }}
                  style={styles.addPetPromptBtn}
                  leftIcon={<AppText variant="title" color={colors.primary} style={{ fontSize: 20 }}>+</AppText>}
                />
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Select date</AppText>
            <View style={[styles.switchRow, { backgroundColor: colors.surfaceContainer }]}>
              <AppText variant="body" color={colors.onSurface}>
                {t('post.request.multiDay')}
              </AppText>
              <AppSwitch
                value={multiDay}
                onValueChange={setMultiDay}
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
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>{t('post.request.detailsTitle')}</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.detailHint}>
              {t('post.request.detailsHint')}
            </AppText>
            <View style={styles.detailSections}>
              <ChipSelector
                label="Yard type:"
                options={['fenced yard', 'high fence', 'no yard']}
                selectedOption={yardType}
                onSelect={setYardType}
              />
              <ChipSelector
                label="Age range:"
                options={['0-1 yr', '1-3 yrs', '3-8 yrs', '8+ yrs']}
                selectedOption={ageRange}
                onSelect={setAgeRange}
              />
              <ChipSelector
                label="Energy level:"
                options={['low energy', 'medium energy', 'high energy']}
                selectedOption={energyLevel}
                onSelect={setEnergyLevel}
              />
            </View>
            <Input
              label="Special needs (e.g. medication, diet)…"
              value={specialNeeds}
              onChangeText={setSpecialNeeds}
              multiline
              inputStyle={styles.specialNeedsInput}
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>Preview of your request</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.previewSubtitle}>
              Tap on any item to edit it directly before launching.
            </AppText>
            
            <View style={styles.directEditSection}>
              {/* Care Type Selection */}
              <View style={styles.inlineCol}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
                  Care you need:
                </AppText>
                <CareTypeSelector
                  options={CARE_TYPE_OPTIONS}
                  selectedKeys={[careType]}
                  onToggle={toggleCareType}
                />
              </View>

              {/* Pet Selection Summary */}
              <View style={styles.inlineCol}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
                  Selected pet:
                </AppText>
                <View style={styles.selectedPetRow}>
                  <AppImage
                    source={{ uri: MOCK_PETS.find(p => p.id === selectedPet)?.imageUri || MOCK_PETS[0].imageUri }}
                    style={styles.selectedPetThumb}
                    contentFit="cover"
                  />
                  <AppText variant="body" style={{ fontWeight: '500' }}>
                    {MOCK_PETS.find(p => p.id === selectedPet)?.name || 'No pet selected'}
                  </AppText>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.editLink}>
                    <AppText variant="caption" color={colors.primary}>Change</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Details (Yard, etc) */}
              <View style={styles.inlineCol}>
                <ChipSelector
                  label="Yard type:"
                  options={['fenced yard', 'high fence', 'no yard']}
                  selectedOption={yardType}
                  onSelect={setYardType}
                />
              </View>

              {/* Days Selection */}
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

              {/* Time Selection */}
              <View style={styles.inlineCol}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
                  Time:
                </AppText>
                <View style={styles.timeRow}>
                  <View style={{ flex: 1 }}>
                    <DateTimeField
                      mode="time"
                      label="Start"
                      value={timeStart}
                      onChange={setTimeStart}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DateTimeField
                      mode="time"
                      label="End"
                      value={timeEnd}
                      onChange={setTimeEnd}
                    />
                  </View>
                </View>
              </View>

              <Input
                label="Special needs"
                value={specialNeeds}
                onChangeText={setSpecialNeeds}
                multiline
                inputStyle={styles.noteInput}
              />
            </View>

            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.disclaimer}>
              By tapping Launch, you approve that anyone in the community can apply or contact you in our chat system.
            </AppText>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === TOTAL_STEPS - 1 ? 'Launch' : 'Next'}
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
  hintsBox: {
    padding: 20,
    borderRadius: 24,
    gap: 16,
    marginTop: 8,
  },
  hintsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  lightbulbWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'flex-start',
  },
  petTile: {
    width: 100,
    alignItems: 'center',
    gap: 8,
  },
  petTileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 20,
    padding: 2,
    overflow: 'hidden',
  },
  petTileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  petName: {
    textAlign: 'center',
    fontWeight: '500',
  },
  petTileAdd: {
    width: 100,
    alignItems: 'center',
    gap: 8,
  },
  petTileAddCircle: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIllustration: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  addPetPromptBtn: {
    minWidth: 160,
    borderRadius: 24,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailSections: {
    gap: 20,
  },
  detailHint: {
    marginTop: -16,
    marginBottom: 4,
  },
  specialNeedsInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  previewSubtitle: {
    marginTop: -16,
    marginBottom: 8,
  },
  directEditSection: {
    gap: 24,
  },
  inlineCol: {
    gap: 8,
  },
  fieldLabel: {
    fontWeight: '600',
  },
  selectedPetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  selectedPetThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  editLink: {
    marginLeft: 'auto',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disclaimer: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
});

