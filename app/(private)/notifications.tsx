import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'New care request for Polo',
    body: 'Jane Ambers sent you a new daytime care request for Mar 14–18.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: '2',
    title: 'Application accepted',
    body: 'Your application to care for Luna was accepted. Get ready for a fun stay!',
    time: 'Yesterday',
    unread: false,
  },
] as const;

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row uses inner padding; background is full-bleed */}
        <View style={styles.header}>
          <AppText variant="headline">{t('notifications.title')}</AppText>
        </View>

        {MOCK_NOTIFICATIONS.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              {t('notifications.noNotifications')}
            </AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {MOCK_NOTIFICATIONS.map((n, index) => (
              <View
                key={n.id}
                style={[
                  styles.itemOuter,
                  { backgroundColor: colors.surface },
                  index !== MOCK_NOTIFICATIONS.length - 1 && {
                    borderBottomColor: colors.outlineVariant,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                {/* Inner padding is applied here, not on the full-width container */}
                <View style={styles.itemInner}>
                  <View style={styles.itemHeader}>
                    <AppText
                      variant="body"
                      style={styles.itemTitle}
                      color={n.unread ? colors.primary : colors.onSurface}
                    >
                      {n.title}
                    </AppText>
                    {n.unread && (
                      <View
                        style={[
                          styles.unreadDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <AppText
                    variant="caption"
                    color={colors.onSurfaceVariant}
                    style={styles.itemBody}
                  >
                    {n.body}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={colors.onSurfaceVariant}
                    style={styles.itemTime}
                  >
                    {n.time}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  list: {
    // no horizontal padding here so items can be full-width
  },
  itemOuter: {
    width: '100%',
  },
  itemInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemBody: {
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});

