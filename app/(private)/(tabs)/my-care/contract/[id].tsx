import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-2">{t('myCare.contract.title')}</Text>
      <Text className="text-text-secondary">ID: {id}</Text>
      {/* TODO: ContractBanner + sign actions */}
    </View>
  );
}
