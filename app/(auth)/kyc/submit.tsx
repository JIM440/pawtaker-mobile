import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function KYCSubmitScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-4">
        {t('auth.kyc.submit.title')}
      </Text>
      <Text className="text-text-secondary mb-6">
        {t('auth.kyc.submit.subtitle')}
      </Text>
      <View className="mb-4">
        <Text className="text-sm text-text-secondary mb-1">
          {t('auth.kyc.submit.documentTypeLabel')}
        </Text>
        <View className="border border-border rounded-xl px-4 py-3 bg-surface">
          <Text className="text-sm text-text-primary">
            {t('auth.kyc.submit.documentTypePlaceholder')}
          </Text>
        </View>
      </View>
      <View className="mb-8">
        <Text className="text-sm text-text-secondary mb-1">
          {t('auth.kyc.submit.uploadLabel')}
        </Text>
        <View className="border border-dashed border-border rounded-xl px-4 py-6 items-center justify-center bg-surface">
          <Text className="text-sm text-text-secondary">
            {t('auth.kyc.submit.uploadPlaceholder')}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center"
        onPress={() => router.push('/(auth)/kyc/pending')}
      >
        <Text className="text-white font-semibold text-base">{t('auth.kyc.submit.submit')}</Text>
      </TouchableOpacity>
    </View>
  );
}
