import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PostRequestPetScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-6">{t('post.request.pet.title')}</Text>
      {/* TODO: Pet list from useProfile hook */}
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mt-auto mb-6"
        onPress={() => router.push('/(private)/(tabs)/post/request/details')}
      >
        <Text className="text-white font-semibold">{t('common.next')}</Text>
      </TouchableOpacity>
    </View>
  );
}
