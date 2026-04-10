import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { BackHeader } from '@/src/shared/components/layout/BackHeader';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';
import { StepProgress } from '@/src/shared/components/ui/StepProgress';
import { useRouter } from 'expo-router';
import {
  Briefcase,
  Calendar,
  Clock,
  Lightbulb,
  MapPin,
  Pencil,
  Plus,
  Sun,
  SunMoon,
  Volleyball
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from 'react-native';

const TOTAL_STEPS = 5;
const CARE_TYPES = [
  { id: 'Daytime', label: 'Daytime', icon: Sun },
  { id: 'Play/walk', label: 'Play/walk', icon: Volleyball },
  { id: 'Overnight', label: 'Overnight', icon: SunMoon },
  { id: 'Vacation', label: 'Vacation', icon: Briefcase },
] as const;

const HINTS = [
  { label: 'Daytime:', desc: 'Full-day care while you\'re away' },
  { label: 'Play/walk:', desc: 'Quick visits for fun exercises/breaks' },
  { label: 'Overnight:', desc: 'A cozy 1 or 2 night sleepover' },
  { label: 'Vacation:', desc: 'Extended care for your long trips away' },
];

const MOCK_PETS_LIST = [
  { id: '1', name: 'Polo', imageUri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400' },
  { id: '2', name: 'Luna', imageUri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400' },
  { id: '3', name: 'Bobby', imageUri: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400' },
];

export default function LaunchRequestWizardScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [step, setStep] = useState(0);
  const [careType, setCareType] = useState<string | null>('daytime');
  const [selectedPets, setSelectedPets] = useState<string[]>(['1']);
  const [multiDay, setMultiDay] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState('Needs insulin shots twice a day or is very shy around loud noises.');

  const progress = (step + 1) / TOTAL_STEPS;

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else {
      router.replace('/(private)/(tabs)/my-care');
    }
  };

  const renderEmptyPets = () => (
    <View style={styles.emptyContainer}>
      <AppImage
        source={require('@/assets/illustrations/pets/no-pet.svg')}
        type='svg'
        width={200}
        height={180}
        contentFit="contain"
      />
      <AppText variant="title" style={styles.emptyTitle}>Uh oh! You have not uploaded any pets yet</AppText>
      <Button
        label="+ Add a pet"
        variant="outline"
        onPress={() => router.push('/(private)/pets/add')}
        style={styles.emptyAddBtn}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackHeader
        title=""
        onBack={goBack}
        rightSlot={<StepProgress progress={progress} width={120} />}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 0: Care Type */}
        {step === 0 && (
          <View style={styles.tabContainer}>
            <AppText variant="headline" style={styles.stepTitle}>What type of care do you need?</AppText>
            <View style={styles.careGrid}>
              {CARE_TYPES.map((c) => {
                const Icon = c.icon;
                const isSelected = careType === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCareType(c.id)}
                    style={styles.careItem}
                  >
                    <View style={[
                      styles.careIconCircle,
                      { backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceContainerHighest },
                      isSelected && { borderWidth: 2, borderColor: colors.primary }
                    ]}>
                      <Icon size={24} color={isSelected ? colors.primary : colors.onSurfaceVariant} />
                    </View>
                    <AppText
                      variant="body"
                      style={[styles.careLabel, isSelected && { color: colors.primary, fontWeight: '700' }]}
                    >
                      {c.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.hintsContainer, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.hintsHeader}>
                <View style={[styles.hintsIconCircle, { backgroundColor: colors.tertiaryContainer }]}>
                  <Lightbulb size={20} color={colors.onTertiaryContainer} />
                </View>
                <AppText variant="title" style={{ fontSize: 24, fontWeight: '700' }}>Hints</AppText>
              </View>
              <View style={styles.hintsList}>
                {HINTS.map((h, i) => (
                  <AppText key={i} variant="body" style={styles.hintText}>
                    <AppText style={{ fontWeight: '700' }}>{h.label}</AppText> {h.desc}
                  </AppText>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 1: Select Pet */}
        {step === 1 && (
          <View style={styles.tabContainer}>
            <AppText variant="headline" style={styles.stepTitle}>Select pet</AppText>
            {MOCK_PETS_LIST.length === 0 ? renderEmptyPets() : (
              <View style={styles.petSelectionContainer}>
                <View style={styles.petGrid}>
                  {MOCK_PETS_LIST.map((pet) => {
                    const isSelected = selectedPets.includes(pet.id);
                    return (
                      <TouchableOpacity
                        key={pet.id}
                        onPress={() => {
                          if (isSelected) setSelectedPets(prev => prev.filter(id => id !== pet.id));
                          else setSelectedPets(prev => [...prev, pet.id]);
                        }}
                        style={styles.petItem}
                      >
                        <View style={[
                          styles.petImageContainer,
                          isSelected && { borderColor: colors.primary, borderWidth: 3 }
                        ]}>
                          <AppImage source={{ uri: pet.imageUri }} style={styles.petImage} contentFit="cover" />
                        </View>
                        <AppText
                          variant="body"
                          style={[styles.petLabel, isSelected && { color: colors.primary, fontWeight: '700' }]}
                        >
                          {pet.name}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.addAnotherPet}
                  onPress={() => router.push('/(private)/pets/add')}
                >
                  <Plus size={20} color={colors.primary} />
                  <AppText variant="body" color={colors.primary}>or add another pet</AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Step 2: Select Date */}
        {step === 2 && (
          <View style={styles.tabContainer}>
            <AppText variant="headline" style={styles.stepTitle}>Select date</AppText>
            <View style={styles.multiDayToggle}>
              <AppText variant="body" color={colors.onSurfaceVariant}>Need this service for more than 1 day</AppText>
              <Switch
                value={multiDay}
                onValueChange={setMultiDay}
                trackColor={{ false: colors.surfaceContainerHighest, true: colors.primary }}
                thumbColor="white"
              />
            </View>

            {multiDay ? (
              <View style={styles.dateInputsRow}>
                <View style={[styles.dateInputWrapper, { backgroundColor: colors.surfaceContainerLow }]}>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>Start Date</AppText>
                  <View style={styles.dateInputContent}>
                    <AppText variant="body" color={colors.onSurfaceVariant}>mm/dd/yy</AppText>
                    <Calendar size={20} color={colors.onSurfaceVariant} />
                  </View>
                </View>
                <View style={[styles.dateInputWrapper, { backgroundColor: colors.surfaceContainerLow }]}>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>End Date</AppText>
                  <View style={styles.dateInputContent}>
                    <AppText variant="body" color={colors.onSurfaceVariant}>mm/dd/yy</AppText>
                    <Calendar size={20} color={colors.onSurfaceVariant} />
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.dateInputWrapperLarge, { backgroundColor: colors.surfaceContainerLow }]}>
                <AppText variant="caption" color={colors.onSurfaceVariant}>Date</AppText>
                <View style={styles.dateInputContent}>
                  <AppText variant="body" color={colors.onSurfaceVariant}>mm/dd/yy</AppText>
                  <Calendar size={20} color={colors.onSurfaceVariant} />
                </View>
              </View>
            )}

            <View style={[styles.calendarPlaceholder, { backgroundColor: colors.surfaceContainerLow }]}>
              <Calendar size={64} color={colors.onSurfaceVariant} style={{ opacity: 0.1, marginBottom: 16 }} />
              <AppText variant="caption" color={colors.onSurfaceVariant}>Interactive Calendar Layer</AppText>
            </View>
          </View>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <View style={styles.tabContainer}>
            <AppText variant="headline" style={styles.stepTitle}>Just some more details</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={{ marginBottom: 24 }}>
              Add extra information that will help the taker know what you need for this care
            </AppText>

            <View style={styles.detailsField}>
              <AppText variant="label" style={{ marginBottom: 8 }}>Details</AppText>
              <View style={[styles.detailsBox, { backgroundColor: colors.surfaceContainerLow }]}>
                <AppText variant="body" color={colors.onSurfaceVariant}>
                  fenced yard • 3-8 yrs • medium energy
                </AppText>
              </View>
            </View>

            <View style={styles.detailsField}>
              <AppText variant="label" style={{ marginBottom: 8 }}>Special needs</AppText>
              <View style={[styles.specialNeedsBox, { borderColor: colors.outlineVariant }]}>
                <AppText variant="body" color={colors.onSurfaceVariant}>
                  {specialNeeds}
                </AppText>
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <View style={styles.tabContainer}>
            <AppText variant="headline" style={styles.stepTitle}>Preview of your request</AppText>

            {/* Service Type Preview */}
            <View style={styles.previewSection}>
              <View style={styles.previewSectionHeader}>
                <View style={styles.previewSubLabel}>
                  <Sun size={18} color={colors.onSurface} strokeWidth={2.5} />
                  <AppText variant="body" style={{ fontWeight: '600' }}>Daytime</AppText>
                </View>
                <TouchableOpacity onPress={() => setStep(0)}><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
              </View>
            </View>

            {/* Date/Time Preview */}
            <View style={styles.previewSection}>
              <View style={styles.previewSectionHeader}>
                <View style={styles.previewSubLabel}>
                  <Calendar size={18} color={colors.onSurface} />
                  <AppText variant="body" style={{ fontWeight: '600' }}>Mar 14 - Mar 18</AppText>
                </View>
                <TouchableOpacity onPress={() => setStep(2)}><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
              </View>
              <View style={[styles.previewSectionHeader, { marginTop: 8 }]}>
                <View style={styles.previewSubLabel}>
                  <Clock size={18} color={colors.onSurface} />
                  <AppText variant="body" style={{ fontWeight: '600' }}>8 AM - 9 PM</AppText>
                </View>
                <TouchableOpacity onPress={() => setStep(2)}><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
              </View>
            </View>

            {/* Pet Card Preview */}
            <View style={[styles.previewCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.previewCardImgWrap}>
                <AppImage source={{ uri: MOCK_PETS_LIST[0].imageUri }} style={styles.previewCardImg} contentFit="cover" />
                <View style={styles.cardPagination}>
                  <View style={[styles.cardDot, { backgroundColor: colors.primary, width: 16 }]} />
                  <View style={[styles.cardDot, { backgroundColor: colors.outlineVariant }]} />
                  <View style={[styles.cardDot, { backgroundColor: colors.outlineVariant }]} />
                </View>
              </View>

              <View style={styles.previewCardContent}>
                <View style={styles.previewCardHeader}>
                  <View>
                    <AppText variant="headline" style={{ fontSize: 22 }}>Polo</AppText>
                    <AppText variant="body" color={colors.onSurfaceVariant}>Golden Retriever • Dog</AppText>
                  </View>
                  <TouchableOpacity onPress={() => setStep(1)}><Pencil size={18} color={colors.onSurface} /></TouchableOpacity>
                </View>

                <View style={styles.previewLocation}>
                  <MapPin size={16} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>Lake Placid, New York, US</AppText>
                </View>

                <AppText variant="body" color={colors.onSurfaceVariant} numberOfLines={2} style={styles.previewBio}>
                  Polo is a friendly and energetic golden retriever who loves long walks…
                </AppText>

                <View style={styles.previewTags}>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    <AppText style={{ fontWeight: '700' }}>Details: </AppText> fenced yard • 3-8 yrs • medium energy
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={{ marginTop: 4 }}>
                    <AppText style={{ fontWeight: '700' }}>Special needs: </AppText> {specialNeeds}
                  </AppText>
                </View>

                <View style={[styles.previewDivider, { backgroundColor: colors.outlineVariant }]} />

                <View style={styles.userRow}>
                  <View style={styles.userInfo}>
                    <AppImage source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200' }} style={styles.userAvatar} contentFit="cover" />
                    <View>
                      <AppText variant="body" style={{ fontWeight: '700' }}>Jane Ambers</AppText>
                      <AppText variant="caption" color={colors.onSurfaceVariant}>4.4 (21 reviews)</AppText>
                    </View>
                  </View>
                  <AppText variant="body" color={colors.primary} style={{ fontWeight: '700' }}>View Profile</AppText>
                </View>
              </View>
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
          style={{ height: 56, borderRadius: 28 }}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  tabContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  careGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  careItem: {
    alignItems: 'center',
    gap: 8,
  },
  careIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careLabel: {
    fontSize: 14,
    color: '#666',
  },
  hintsContainer: {
    padding: 24,
    borderRadius: 32,
    gap: 16,
  },
  hintsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hintsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintsList: {
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#444',
  },
  petSelectionContainer: {
    flex: 1,
  },
  petGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  petItem: {
    alignItems: 'center',
    gap: 8,
  },
  petImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  petLabel: {
    fontSize: 14,
    color: '#666',
  },
  addAnotherPet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  multiDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateInputWrapper: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  dateInputWrapperLarge: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarPlaceholder: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsField: {
    marginBottom: 24,
  },
  detailsBox: {
    padding: 16,
    borderRadius: 16,
  },
  specialNeedsBox: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 100,
  },
  previewSection: {
    marginBottom: 16,
    paddingBottom: 16,
  },
  previewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewSubLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewCard: {
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
  },
  previewCardImgWrap: {
    height: 200,
    position: 'relative',
  },
  previewCardImg: {
    width: '100%',
    height: '100%',
  },
  cardPagination: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cardDot: {
    height: 6,
    borderRadius: 3,
  },
  previewCardContent: {
    padding: 24,
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  previewBio: {
    lineHeight: 20,
    marginBottom: 16,
  },
  previewTags: {
    marginBottom: 20,
  },
  previewDivider: {
    height: 1,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  disclaimer: {
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyAddBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
