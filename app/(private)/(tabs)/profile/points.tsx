import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function PointsHistoryScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-6">
        <Text className="text-xl font-bold text-text-primary mb-6">{t('profile.pointsHistory.title')}</Text>
        {/* TODO: Point transactions list */}
      </View>
    </ScrollView>
  );
}
