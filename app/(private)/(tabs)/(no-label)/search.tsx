import { View, Text, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SearchScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-xl font-bold text-text-primary mb-4">{t('search.title')}</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-text-primary"
          placeholder={t('search.placeholder')}
          placeholderTextColor="#6B7280"
        />
      </View>
      <ScrollView className="flex-1 px-4">
        {/* TODO: Search results with useDebounce hook */}
      </ScrollView>
    </View>
  );
}
