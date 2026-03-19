import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';

export default function PostChooseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [modalVisible, setModalVisible] = useState(true);

  const openRequest = () => {
    setModalVisible(false);
    router.replace('/(private)/(tabs)/post/requests');
  };

  const openAvailability = () => {
    setModalVisible(false);
    router.replace('/(private)/(tabs)/post/availability');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}
            onPress={(e) => e.stopPropagation()}
          >
            <AppText variant="title" style={styles.title}>
              {t('post.choose.title')}
            </AppText>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={openRequest}
              activeOpacity={0.9}
            >
              <AppText variant="title" color={colors.onPrimary}>
                {t('post.choose.requestCare')}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.primary }]}
              onPress={openAvailability}
              activeOpacity={0.9}
            >
              <AppText variant="title" color={colors.primary}>
                {t('post.choose.offerAvailability')}
              </AppText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
