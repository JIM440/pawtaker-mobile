import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function EmergencyContactsScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background px-4 pt-6">
      <Text className="text-xl font-bold text-text-primary mb-6">{t('profile.emergencyContacts.title')}</Text>
      {/* TODO: Emergency contacts list + add form */}
      <TouchableOpacity className="bg-primary w-full py-4 rounded-xl items-center mt-auto mb-6">
        <Text className="text-white font-semibold">{t('profile.emergencyContacts.add')}</Text>
      </TouchableOpacity>
    </View>
  );
}
