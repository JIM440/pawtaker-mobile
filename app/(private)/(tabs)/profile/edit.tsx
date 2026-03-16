import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';

export default function EditProfileScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [name, setName] = useState('Jane Ambers');
  const [location, setLocation] = useState('Lake Placid, New York, US');
  const [bio, setBio] = useState('Pet lover, weekend hiker, and coffee enthusiast.');

  const handleSave = () => {
    // TODO: persist profile changes
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="headline" style={styles.title}>
          Edit profile
        </AppText>

        <View style={styles.field}>
          <AppText variant="label" color={colors.onSurfaceVariant} style={styles.label}>
            Name
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { borderColor: colors.outlineVariant, color: colors.onSurface }]}
            placeholder="Your name"
            placeholderTextColor={colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label" color={colors.onSurfaceVariant} style={styles.label}>
            Location
          </AppText>
          <TextInput
            value={location}
            onChangeText={setLocation}
            style={[styles.input, { borderColor: colors.outlineVariant, color: colors.onSurface }]}
            placeholder="City, Country"
            placeholderTextColor={colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="label" color={colors.onSurfaceVariant} style={styles.label}>
            Short bio
          </AppText>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[
              styles.input,
              styles.textarea,
              { borderColor: colors.outlineVariant, color: colors.onSurface },
            ]}
            placeholder="Tell others about you"
            placeholderTextColor={colors.onSurfaceVariant}
            multiline
          />
        </View>

        <View style={styles.sectionHeader}>
          <AppText variant="label" color={colors.onSurfaceVariant}>
            Your pets
          </AppText>
          <Button
            label="+ Add a pet"
            variant="outline"
            fullWidth={false}
            onPress={() => router.push('/(private)/pets/add')}
          />
        </View>

        <AppText variant="caption" color={colors.onSurfaceVariant}>
          Manage detailed pet profiles from the pet cards on your profile.
        </AppText>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save changes" onPress={handleSave} />
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
});