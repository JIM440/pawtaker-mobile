import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/src/shared/components/forms/TextField';

export default function LoginScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-8">{t('auth.login.title')}</Text>
      <TextField
        label={t('auth.login.emailLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.login.emailPlaceholder')}
        keyboardType="email-address"
      />
      <TextField
        label={t('auth.login.passwordLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.login.passwordPlaceholder')}
        secureTextEntry
      />
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mb-4"
        onPress={() => router.replace('/(private)/(tabs)')}
      >
        <Text className="text-white font-semibold text-base">{t('auth.login.submit')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/signup/credentials')}>
        <Text className="text-primary-light text-center text-base">{t('auth.login.noAccount')}</Text>
      </TouchableOpacity>
    </View>
  );
}
