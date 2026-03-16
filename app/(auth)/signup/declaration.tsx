import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function SignupDeclarationScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-2xl font-bold text-text-primary mb-4">{t('auth.signup.declaration.title')}</Text>
      <Text className="text-text-secondary mb-6">{t('auth.signup.declaration.subtitle')}</Text>
      <View className="mb-8">
        <View className="flex-row items-start mb-3">
          <View className="w-4 h-4 rounded border border-border mr-3" />
          <Text className="flex-1 text-sm text-text-secondary">
            {t('auth.signup.declaration.point1')}
          </Text>
        </View>
        <View className="flex-row items-start mb-3">
          <View className="w-4 h-4 rounded border border-border mr-3" />
          <Text className="flex-1 text-sm text-text-secondary">
            {t('auth.signup.declaration.point2')}
          </Text>
        </View>
        <View className="flex-row items-start">
          <View className="w-4 h-4 rounded border border-border mr-3" />
          <Text className="flex-1 text-sm text-text-secondary">
            {t('auth.signup.declaration.point3')}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center"
        onPress={() => router.push('/(auth)/kyc/submit')}
      >
        <Text className="text-white font-semibold text-base">{t('auth.signup.declaration.submit')}</Text>
      </TouchableOpacity>
    </View>
  );
}
