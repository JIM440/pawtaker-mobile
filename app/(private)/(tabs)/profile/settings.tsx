import { Colors } from "@/src/constants/colors";
import i18n from "@/src/lib/i18n";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useLanguageStore } from "@/src/lib/store/language.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { router } from "expo-router";
import { ChevronDown, LogOut, Trash2, UserX } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthStore();
  const [confirmAction, setConfirmAction] = useState<
    null | "logout" | "deactivate" | "delete"
  >(null);
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [openMenu, setOpenMenu] = useState<"theme" | "language" | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const themeButtonRef = useRef<View | null>(null);
  const languageButtonRef = useRef<View | null>(null);

  const themeLabel =
    theme === "system"
      ? t("settings.themeSystem", "System Default")
      : theme === "light"
        ? t("settings.themeLight", "Light")
        : t("settings.themeDark", "Dark");

  const languageLabel =
    language === "fr"
      ? t("settings.languageFrench", "Français")
      : t("settings.languageEnglish", "English");
  const colors = Colors[resolvedTheme];

  const handleLogout = async () => {
    setConfirmAction(null);
    await supabase.auth.signOut();
    signOut();
    router.replace("/(auth)/welcome");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title={t("settings.title")} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 24,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginBottom: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.outlineVariant,
          }}
        >
          <Text
            style={{
              marginBottom: 16,
              fontSize: 14,
              fontWeight: "700",
              color: colors.onSurfaceVariant,
            }}
          >
            {t("settings.preferencesSection", "Preferences")}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.onSurface }}>
              {t("settings.theme")}
            </Text>
            <TouchableOpacity
              ref={themeButtonRef}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 4,
                backgroundColor: colors.surfaceBright,
              }}
              activeOpacity={0.8}
              onPress={() => {
                themeButtonRef.current?.measureInWindow(
                  (x, y, width, height) => {
                    setMenuPosition({ x, y, width, height });
                    setOpenMenu("theme");
                  },
                );
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.onSurfaceVariant,
                  marginRight: 4,
                }}
              >
                {themeLabel}
              </Text>
              <ChevronDown size={12} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.onSurface }}>
              {t("settings.language")}
            </Text>
            <TouchableOpacity
              ref={languageButtonRef}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 4,
                backgroundColor: colors.surfaceBright,
              }}
              activeOpacity={0.8}
              onPress={() => {
                languageButtonRef.current?.measureInWindow(
                  (x, y, width, height) => {
                    setMenuPosition({ x, y, width, height });
                    setOpenMenu("language");
                  },
                );
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.onSurfaceVariant,
                  marginRight: 4,
                }}
              >
                {languageLabel}
              </Text>
              <ChevronDown size={12} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={{ paddingVertical: 8 }}>
            <Text style={{ color: colors.onSurface }}>
              {t("settings.editProfile", "Edit profile")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.notifications")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.privacy")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.onSurface }}>{t("settings.help")}</Text>
        </TouchableOpacity>
        <View
          style={{
            marginTop: 24,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.outlineVariant,
          }}
        >
          <Text
            style={{
              marginBottom: 16,
              fontSize: 14,
              fontWeight: "700",
              color: colors.onSurfaceVariant,
            }}
          >
            {t("settings.accountSection", "Account")}
          </Text>

          <TouchableOpacity
            style={{ paddingVertical: 8 }}
            onPress={() => setConfirmAction("logout")}
          >
            <Text style={{ color: colors.onSurface }}>
              {t("settings.logout")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 8 }}
            onPress={() => setConfirmAction("deactivate")}
          >
            <Text style={{ color: colors.onSurface }}>
              {t("settings.deactivateAccount", "Deactivate account")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ paddingVertical: 16, marginTop: 8 }}
            onPress={() => setConfirmAction("delete")}
          >
            <Text style={{ color: colors.error, fontWeight: "500" }}>
              {t("settings.deleteAccount", "Delete account")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer links */}
        <View
          style={{
            marginTop: 48,
            paddingHorizontal: 16,
            flexDirection: "row",
            justifyContent: "center",
            columnGap: 24,
          }}
        >
          <TouchableOpacity activeOpacity={0.7}>
            <Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: colors.onSurfaceVariant,
              }}
            >
              {t("settings.contactUs", "Contact us")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: colors.onSurfaceVariant,
              }}
            >
              {t("settings.termsAndPolicies", "Terms and policies")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={openMenu !== null}
        animationType="fade"
        onRequestClose={() => setOpenMenu(null)}
      >
        <Pressable
          className="flex-1 bg-black/20"
          onPress={() => setOpenMenu(null)}
        >
          {menuPosition && (
            <View
              style={{
                position: "absolute",
                top: menuPosition.y + menuPosition.height + 4,
                left: menuPosition.x,
                width: Math.max(menuPosition.width, 200),
                borderRadius: 12,
                backgroundColor: colors.surfaceContainerLowest,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowOffset: { width: 0, height: 12 },
                shadowRadius: 16,
                overflow: "hidden",
              }}
            >
              {openMenu === "theme" && (
                <>
                  <Pressable
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.outlineVariant,
                      backgroundColor: colors.surfaceContainer,
                    }}
                    onPress={() => {
                      setTheme("system");
                      setOpenMenu(null);
                    }}
                  >
                    <Text style={{ color: colors.onSurface }}>{t("settings.themeSystem")}</Text>
                  </Pressable>
                  <Pressable
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.outlineVariant,
                      backgroundColor: colors.surfaceContainerLowest,
                    }}
                    onPress={() => {
                      setTheme("light");
                      setOpenMenu(null);
                    }}
                  >
                    <Text style={{ color: colors.onSurface }}>{t("settings.themeLight")}</Text>
                  </Pressable>
                  <Pressable
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: colors.surfaceContainerLowest,
                    }}
                    onPress={() => {
                      setTheme("dark");
                      setOpenMenu(null);
                    }}
                  >
                    <Text style={{ color: colors.onSurface }}>{t("settings.themeDark")}</Text>
                  </Pressable>
                </>
              )}

              {openMenu === "language" && (
                <>
                  <Pressable
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.outlineVariant,
                      backgroundColor: colors.surfaceContainer,
                    }}
                    onPress={() => {
                      setLanguage("en");
                      i18n.changeLanguage("en");
                      setOpenMenu(null);
                    }}
                  >
                    <Text style={{ color: colors.onSurface }}>{t("settings.languageEnglish")}</Text>
                  </Pressable>
                  <Pressable
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: colors.surfaceContainerLowest,
                    }}
                    onPress={() => {
                      setLanguage("fr");
                      i18n.changeLanguage("fr");
                      setOpenMenu(null);
                    }}
                  >
                    <Text style={{ color: colors.onSurface }}>{t("settings.languageFrench")}</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </Pressable>
      </Modal>

      <FeedbackModal
        visible={confirmAction !== null}
        icon={
          confirmAction === "logout" ? (
            <LogOut size={24} color={colors.primary} />
          ) : confirmAction === "deactivate" ? (
            <UserX size={24} color={colors.primary} />
          ) : confirmAction === "delete" ? (
            <Trash2 size={24} color={colors.primary} />
          ) : undefined
        }
        title={
          confirmAction === "logout"
            ? t("settings.logoutTitle", "Sign out?")
            : confirmAction === "deactivate"
              ? t("settings.deactivateTitle", "Deactivate account?")
              : confirmAction === "delete"
                ? t("settings.deleteTitle", "Delete account?")
                : ""
        }
        description={
          confirmAction === "logout"
            ? t(
                "settings.logoutConfirm",
                "You will need to sign back in to view your messages and manage your profile.",
              )
            : confirmAction === "deactivate"
              ? t(
                  "settings.deactivateConfirm",
                  "Your account will be paused. You will not appear in searches or receive new messages.",
                )
              : confirmAction === "delete"
                ? t(
                    "settings.deleteConfirm",
                    "This will permanently delete your account and all related data. This action cannot be undone.",
                  )
                : ""
        }
        primaryLabel={
          confirmAction === "logout"
            ? t("settings.logoutCta", "Sign Out")
            : confirmAction === "deactivate"
              ? t("settings.deactivateCta", "Deactivate")
              : confirmAction === "delete"
                ? t("settings.deleteCta", "Delete")
                : ""
        }
        secondaryLabel={t("common.cancel", "Cancel")}
        destructive={
          confirmAction === "logout" ||
          confirmAction === "deactivate" ||
          confirmAction === "delete"
        }
        onPrimary={async () => {
          if (confirmAction === "logout") {
            await handleLogout();
          } else {
            // TODO: wire real deactivate/delete flows
            setConfirmAction(null);
          }
        }}
        onSecondary={() => setConfirmAction(null)}
        onRequestClose={() => setConfirmAction(null)}
      />
    </View>
  );
}
