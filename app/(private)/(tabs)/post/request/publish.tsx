import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PostRequestPublishScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-6">{t('post.request.publish.title')}</Text>
      {/* TODO: Summary + publish action */}
      <TouchableOpacity
        className="bg-accent w-full py-4 rounded-xl items-center mt-auto mb-6"
        onPress={() => router.replace('/(private)/(tabs)')}
      >
        <Text className="text-white font-semibold">{t('post.request.publish.publish')}</Text>
      </TouchableOpacity>
    </View>
  );
}
