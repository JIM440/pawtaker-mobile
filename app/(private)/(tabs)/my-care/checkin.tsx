import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CheckinScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-4">{t('myCare.checkin.title')}</Text>
      {/* TODO: Photo upload + note + useCheckin hook */}
    </View>
  );
}
