import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/src/shared/components/forms/TextField';

export default function SignupProfileScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-8">
        {t('auth.signup.profile.title')}
      </Text>
      <TextField
        label={t('auth.signup.profile.displayNameLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.signup.profile.displayNamePlaceholder')}
      />
      <TextField
        label={t('auth.signup.profile.locationLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.signup.profile.locationPlaceholder')}
      />
      <TextField
        label={t('auth.signup.profile.bioLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.signup.profile.bioPlaceholder')}
      />
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center"
        onPress={() => router.push('/(auth)/signup/declaration')}
      >
        <Text className="text-white font-semibold text-base">{t('auth.signup.profile.submit')}</Text>
      </TouchableOpacity>
    </View>
  );
}
