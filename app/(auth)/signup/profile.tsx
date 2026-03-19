import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSignupStore } from '@/src/lib/store/signup.store';
import { TextField } from '@/src/shared/components/forms/TextField';

export default function SignupProfileScreen() {
  const { t } = useTranslation();
  const { setProfile } = useSignupStore();

  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);

    if (!displayName.trim() || !location.trim()) {
      setError(t('errors.required'));
      return;
    }

    // Save to Zustand only — no Supabase call here
    setProfile(displayName.trim(), location.trim(), bio.trim());
    router.push('/(auth)/signup/declaration');
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 justify-center flex-grow"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-text-primary mb-8">
        {t('auth.signup.profile.title')}
      </Text>

      <TextField
        label={t('auth.signup.profile.displayNameLabel')}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t('auth.signup.profile.displayNamePlaceholder')}
        autoCapitalize="words"
      />
      <TextField
        label={t('auth.signup.profile.locationLabel')}
        value={location}
        onChangeText={setLocation}
        placeholder={t('auth.signup.profile.locationPlaceholder')}
        autoCapitalize="words"
      />
      <TextField
        label={t('auth.signup.profile.bioLabel')}
        value={bio}
        onChangeText={setBio}
        placeholder={t('auth.signup.profile.bioPlaceholder')}
        multiline
      />

      {error && (
        <Text className="text-danger text-sm mb-4">{error}</Text>
      )}

      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mt-2"
        onPress={handleNext}
      >
        <Text className="text-white font-semibold text-base">
          {t('auth.signup.profile.submit')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
