import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AddPetScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-6">{t('pets.add.title')}</Text>
      {/* TODO: Pet form */}
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mt-auto mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-white font-semibold">{t('pets.add.submit')}</Text>
      </TouchableOpacity>
    </View>
  );
}
