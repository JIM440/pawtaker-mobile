import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/src/shared/components/forms/TextField';

export default function SignupCredentialsScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-8">
        {t('auth.signup.credentials.title')}
      </Text>
      <TextField
        label={t('auth.signup.credentials.nameLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.signup.credentials.namePlaceholder')}
      />
      <TextField
        label={t('auth.signup.credentials.emailLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.signup.credentials.emailPlaceholder')}
        keyboardType="email-address"
      />
      <TextField
        label={t('auth.signup.credentials.passwordLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.signup.credentials.passwordPlaceholder')}
        secureTextEntry
      />
      <TextField
        label={t('auth.signup.credentials.confirmPasswordLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.signup.credentials.confirmPasswordPlaceholder')}
        secureTextEntry
      />
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center"
        onPress={() => router.push('/(auth)/signup/profile')}
      >
        <Text className="text-white font-semibold text-base">{t('auth.signup.credentials.submit')}</Text>
      </TouchableOpacity>
    </View>
  );
}
