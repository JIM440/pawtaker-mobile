import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { Bell, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastNotification = {
  title: string;
  body: string;
  data?: any;
};

type Props = {
  notification: ToastNotification | null;
  onDismiss: () => void;
  onPress: (data: any) => void;
};

export function NotificationToast({ notification, onDismiss, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!notification) return;

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!notification) return null;

  const d = notification.data;
  const senderUri =
    d?.messageType === 'proposal' &&
    typeof d?.sender_avatar_url === 'string' &&
    d.sender_avatar_url.trim().length > 0
      ? d.sender_avatar_url.trim()
      : null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          dismiss();
          onPress(notification.data);
        }}
        activeOpacity={0.9}
        style={[
          styles.inner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {senderUri ? (
          <AppImage
            source={{ uri: senderUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight + '22' }]}>
            <Bell size={20} color={colors.primary} />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text
            style={[styles.body, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>

        <TouchableOpacity onPress={dismiss} style={styles.closeButton} hitSlop={8}>
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
