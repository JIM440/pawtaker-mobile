import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PostRequestDetailsScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-6">{t('post.request.details.title')}</Text>
      {/* TODO: Care type, dates, points, description */}
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mt-auto mb-6"
        onPress={() => router.push('/(private)/(tabs)/post/request/publish')}
      >
        <Text className="text-white font-semibold">{t('common.next')}</Text>
      </TouchableOpacity>
    </View>
  );
}
