import { Colors } from "@/src/constants/colors";
import { performSignOut } from "@/src/lib/auth/perform-sign-out";
import { SettingsMenuOverlay } from "@/src/features/profile/components/settings/SettingsMenuOverlay";
import i18n from "@/src/lib/i18n";
import { useLanguageStore } from "@/src/lib/store/language.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronDown, LogOut, Trash2, UserX } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<
    null | "logout" | "deactivate" | "delete"
  >(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [openMenu, setOpenMenu] = useState<"theme" | "language" | null>(null);
  const [signOutErrorMessage, setSignOutErrorMessage] = useState<string | null>(
    null,
  );
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
    try {
      setIsSigningOut(true);
      await performSignOut();
      queryClient.clear();
      setConfirmAction(null);
      router.replace("/welcome");
    } catch (e) {
      console.error("[settings] signOut", e);
      setSignOutErrorMessage(
        t("settings.signOutFailed", "Could not sign out. Please try again."),
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;

      try {
        await performSignOut();
      } catch {
        /* account is already deleted server-side; local cleanup continues below */
      }

      queryClient.clear();
      setConfirmAction(null);
      router.replace("/welcome");
    } catch (e) {
      console.error("[settings] deleteAccount", e);
      setSignOutErrorMessage(
        t("settings.deleteFailed", "Could not delete account. Please try again."),
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 24,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                backgroundColor: colors.surfaceContainerHighest,
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
                backgroundColor: colors.surfaceContainerHighest,
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
        </View>

        <TouchableOpacity
          style={{
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.notifications")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingVertical: 16,
          }}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.privacy")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingVertical: 16,
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

      <SettingsMenuOverlay
        openMenu={openMenu}
        menuPosition={menuPosition}
        colors={colors}
        t={(key, fallback) => t(key, fallback as string)}
        onClose={() => setOpenMenu(null)}
        onTheme={(next) => {
          setTheme(next);
          setOpenMenu(null);
        }}
        onLanguage={(next) => {
          setLanguage(next);
          i18n.changeLanguage(next);
          setOpenMenu(null);
        }}
      />

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
          confirmAction === "logout" && isSigningOut
            ? t("settings.signingOut", "Signing out...")
            : confirmAction === "logout"
              ? t("settings.logoutCta", "Sign Out")
              : confirmAction === "deactivate"
                ? t("settings.deactivateCta", "Deactivate")
                : confirmAction === "delete" && isDeletingAccount
                  ? t("settings.deleting", "Deleting...")
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
        primaryLoading={
          (confirmAction === "logout" && isSigningOut) ||
          (confirmAction === "delete" && isDeletingAccount)
        }
        onPrimary={async () => {
          if (confirmAction === "logout") {
            await handleLogout();
          } else if (confirmAction === "delete") {
            await handleDeleteAccount();
          } else {
            // TODO: wire real deactivate/delete flows
            setConfirmAction(null);
          }
        }}
        onSecondary={() => setConfirmAction(null)}
        onRequestClose={() => setConfirmAction(null)}
      />

      <FeedbackModal
        visible={signOutErrorMessage !== null}
        title={t("common.error", "Something went wrong")}
        description={signOutErrorMessage ?? undefined}
        primaryLabel={t("common.ok", "OK")}
        onPrimary={() => setSignOutErrorMessage(null)}
        onRequestClose={() => setSignOutErrorMessage(null)}
      />
    </View>
  );
}
