import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-2">{t('pets.edit.title')}</Text>
      <Text className="text-text-secondary mb-6">ID: {id}</Text>
      {/* TODO: Edit pet form */}
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl items-center mt-auto mb-6"
        onPress={() => router.back()}
      >
        <Text className="text-white font-semibold">{t('common.save')}</Text>
      </TouchableOpacity>
    </View>
  );
}
