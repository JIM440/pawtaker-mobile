import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/src/lib/supabase/client';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { FeedbackModal } from '@/src/shared/components/ui/FeedbackModal';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await supabase.auth.signOut();
    signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <>
      <ScrollView className="flex-1 bg-background">
        <View className="px-4 pt-6">
          <Text className="text-xl font-bold text-text-primary mb-6">{t('settings.title')}</Text>
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary">{t('settings.language')}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary">{t('settings.theme')}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary">{t('settings.notifications')}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary">{t('settings.privacy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-border">
            <Text className="text-text-primary">{t('settings.help')}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 mt-4" onPress={() => setShowLogoutConfirm(true)}>
            <Text className="text-danger font-medium">{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={showLogoutConfirm}
        title={t('settings.logout')}
        description={t('settings.logoutConfirm') ?? 'Are you sure you want to log out?'}
        primaryLabel={t('common.confirm') ?? 'Log out'}
        secondaryLabel={t('common.cancel') ?? 'Cancel'}
        destructive
        onPrimary={handleLogout}
        onSecondary={() => setShowLogoutConfirm(false)}
        onRequestClose={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
