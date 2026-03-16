import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Home,
  TrendingUp,
  PlusCircle,
  MessageSquareText,
  CircleUserRound,
} from 'lucide-react-native';
import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';

const ICON_SIZE = 18;
const ICON_PILL = { width: 48, height: 28, borderRadius: 999 } as const;
const ON_SURFACE_VARIANT = '#665459';
const LIGHT_ACTIVE_PILL_BG = '#FFE0E8';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const activePillBg =
    resolvedTheme === 'light' ? LIGHT_ACTIVE_PILL_BG : colors.secondaryContainer;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: ON_SURFACE_VARIANT,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 68,
        },
        tabBarLabelStyle: { marginTop: 2, fontSize: 11 },
        tabBarItemStyle: { marginTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('feed.title'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...ICON_PILL,
                backgroundColor: focused ? activePillBg : 'transparent',
                overflow: 'hidden',
              }}
            >
              <Home
                size={ICON_SIZE}
                color={focused ? colors.primary : ON_SURFACE_VARIANT}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-care"
        options={{
          title: t('myCare.title'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...ICON_PILL,
                backgroundColor: focused ? activePillBg : 'transparent',
                overflow: 'hidden',
              }}
            >
              <TrendingUp
                size={ICON_SIZE}
                color={focused ? colors.primary : ON_SURFACE_VARIANT}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: t('post.title'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...ICON_PILL,
                backgroundColor: focused ? activePillBg : 'transparent',
                overflow: 'hidden',
              }}
            >
              <PlusCircle size={ICON_SIZE + 2} color={colors.accent} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('messages.title'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...ICON_PILL,
                backgroundColor: focused ? activePillBg : 'transparent',
                overflow: 'hidden',
              }}
            >
              <MessageSquareText
                size={ICON_SIZE}
                color={focused ? colors.primary : ON_SURFACE_VARIANT}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                ...ICON_PILL,
                backgroundColor: focused ? activePillBg : 'transparent',
                overflow: 'hidden',
              }}
            >
              <CircleUserRound
                size={ICON_SIZE}
                color={focused ? colors.primary : ON_SURFACE_VARIANT}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
