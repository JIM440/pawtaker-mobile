import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

export default function PointsHistoryScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView
      className="flex-1 bg-background"
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-4 pt-6">
        <Text className="text-xl font-bold text-text-primary mb-6">{t('profile.pointsHistory.title')}</Text>
        {/* TODO: Point transactions list */}
      </View>
    </ScrollView>
  );
}
