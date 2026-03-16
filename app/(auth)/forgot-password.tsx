import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/src/shared/components/forms/TextField';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-4">{t('auth.forgotPassword.title')}</Text>
      <Text className="text-text-secondary mb-8">{t('auth.forgotPassword.subtitle')}</Text>
      <TextField
        label={t('auth.forgotPassword.emailLabel')}
        value=""
        onChangeText={() => {}}
        placeholder={t('auth.forgotPassword.emailPlaceholder')}
        keyboardType="email-address"
      />
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center"
        onPress={() => router.back()}
      >
        <Text className="text-white font-semibold text-base">{t('auth.forgotPassword.submit')}</Text>
      </TouchableOpacity>
    </View>
  );
}
