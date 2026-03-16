import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function KYCPendingScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      <Text className="text-2xl font-bold text-text-primary mb-4 text-center">{t('auth.kyc.pending.title')}</Text>
      <Text className="text-text-secondary mb-4 text-center">{t('auth.kyc.pending.subtitle')}</Text>
      <Text className="text-warning font-medium mb-8">{t('auth.kyc.pending.status')}</Text>
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center"
        onPress={() => router.replace('/(private)/(tabs)')}
      >
        <Text className="text-white font-semibold text-base">{t('auth.kyc.pending.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}
