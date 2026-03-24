import { Colors } from "@/src/constants/colors";
import { tabPerfScreenOptions } from "@/src/constants/navigation";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Tabs, usePathname, useRouter } from "expo-router";
import {
  CircleUserRound,
  Home,
  MessageSquareText,
  PlusCircle,
  TrendingUp,
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";

const ICON_SIZE = 18;
const ICON_PILL = { width: 48, height: 28, borderRadius: 999 } as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const router = useRouter();
  const pathname = usePathname();
  const [showPostModal, setShowPostModal] = useState(false);
  const activePillBg = colors.primaryContainer;

  return (
    <>
      <Tabs
        screenOptions={{
          ...tabPerfScreenOptions,
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 80 : 68,
          },
          tabBarLabelStyle: {
            marginTop: 2,
            fontSize: 11,
            color: colors.onSecondaryContainer,
          },
          tabBarItemStyle: {
            flex: 1,
            height: Platform.OS === "ios" ? 80 : 68,
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: t("feed.title"),
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  ...ICON_PILL,
                  backgroundColor: focused ? activePillBg : "transparent",
                  overflow: "hidden",
                }}
              >
                <Home
                  size={ICON_SIZE}
                  color={focused ? colors.primary : colors.onSecondaryContainer}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="my-care"
          options={{
            title: t("myCare.title"),
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  ...ICON_PILL,
                  backgroundColor: focused ? activePillBg : "transparent",
                  overflow: "hidden",
                }}
              >
                <TrendingUp
                  size={ICON_SIZE}
                  color={focused ? colors.primary : colors.onSecondaryContainer}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="post"
          options={{
            title: t("post.title"),
            tabBarButton: ({ style }) => (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (blockIfKycNotApproved()) return;
                  setShowPostModal(true);
                }}
                style={[
                  style,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    ...ICON_PILL,
                    backgroundColor: "transparent",
                    overflow: "hidden",
                    marginTop: -10,
                  }}
                >
                  <PlusCircle
                    size={ICON_SIZE + 2}
                    color={colors.onSecondaryContainer}
                  />
                </View>
                <View style={{ marginTop: 2 }}>
                  <AppText
                    variant="caption"
                    color={colors.onSecondaryContainer}
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {t("post.title")}
                  </AppText>
                </View>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t("messages.title"),
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  ...ICON_PILL,
                  backgroundColor: focused ? activePillBg : "transparent",
                  overflow: "hidden",
                }}
              >
                <MessageSquareText
                  size={ICON_SIZE}
                  color={focused ? colors.primary : colors.onSecondaryContainer}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("profile.title"),
            tabBarButton: ({ style, onPress, children }) => (
              <TouchableOpacity
                style={style}
                activeOpacity={0.8}
                onPress={() => {
                  const currentPath = pathname ?? "";
                  const isViewingOtherUserProfile =
                    currentPath.includes("/profile/users/");

                  if (isViewingOtherUserProfile) {
                    // Reset nested profile stack back to profile index.
                    router.push("/(private)/(tabs)/profile" as any);
                    return;
                  }

                  onPress?.(undefined as any);
                }}
              >
                {children}
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  ...ICON_PILL,
                  backgroundColor: focused ? activePillBg : "transparent",
                  overflow: "hidden",
                }}
              >
                <CircleUserRound
                  size={ICON_SIZE}
                  color={focused ? colors.primary : colors.onSecondaryContainer}
                />
              </View>
            ),
          }}
        />
      </Tabs>

      <Modal
        visible={showPostModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPostModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.1)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowPostModal(false)}
        >
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: Platform.OS === "ios" ? 140 : 128,
              alignItems: "center",
            }}
            pointerEvents="box-none"
          >
            <View
              style={{
                width: 220,
                borderRadius: 8,

                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                overflow: "hidden",
                padding: 8,
              }}
            >
              <Pressable
                android_ripple={{ color: colors.surfaceContainerHighest }}
                style={{ paddingVertical: 16, paddingHorizontal: 12 }}
                onPress={() => {
                  if (blockIfKycNotApproved()) return;
                  setShowPostModal(false);
                  router.push("/(private)/post-requests" as any);
                }}
              >
                <AppText
                  variant="body"
                  color={colors.onSurface}
                  style={{ fontWeight: 600 }}
                >
                  {t("post.launchRequest")}
                </AppText>
              </Pressable>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.outlineVariant,
                  opacity: 0.6,
                }}
              />
              <Pressable
                android_ripple={{ color: colors.surfaceContainerHighest }}
                style={{ paddingVertical: 16, paddingHorizontal: 12 }}
                onPress={() => {
                  if (blockIfKycNotApproved()) return;
                  setShowPostModal(false);
                  router.push("/(private)/post-availability" as any);
                }}
              >
                <AppText
                  variant="body"
                  color={colors.onSurface}
                  style={{ fontWeight: 600 }}
                >
                  {t("post.availableToCare")}
                </AppText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
