import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-3xl font-bold text-primary mb-2">{t('auth.welcome.title')}</Text>
      <Text className="text-base text-text-secondary mb-12 text-center">{t('auth.welcome.subtitle')}</Text>
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mb-4"
        onPress={() => router.push('/(auth)/signup/credentials')}
      >
        <Text className="text-white font-semibold text-base">{t('auth.welcome.getStarted')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text className="text-primary-light text-base">{t('auth.welcome.signIn')}</Text>
      </TouchableOpacity>
    </View>
  );
}
