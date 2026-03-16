import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function PetProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-6">
        <Text className="text-xl font-bold text-text-primary mb-2">{t('pets.profile.title')}</Text>
        <Text className="text-text-secondary">ID: {id}</Text>
        {/* TODO: Pet details */}
      </View>
    </ScrollView>
  );
}
