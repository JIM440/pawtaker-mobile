import { Colors } from "@/src/constants/colors";
import { SettingsMenuOverlay } from "@/src/features/profile/components/settings/SettingsMenuOverlay";
import { performSignOut } from "@/src/lib/auth/perform-sign-out";
import i18n from "@/src/lib/i18n";
import { useLanguageStore } from "@/src/lib/store/language.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppText } from "@/src/shared/components/ui/AppText";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ChevronDown, LogOut, Trash2, UserX } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LocalSvg } from "react-native-svg/css";

const ABOUT_LOGO_SVG = require("@/assets/icons/logos/svg/coloured_favicon.svg");

export default function SettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<
    null | "logout" | "deactivate" | "delete"
  >(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const showToast = useToastStore((s) => s.showToast);
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const [openMenu, setOpenMenu] = useState<"theme" | "language" | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);
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
  const websiteUrl =
    process.env.EXPO_PUBLIC_WEBSITE_URL?.trim() || "https://pawtaker.ca";

  const openLegal = (kind: "terms" | "privacy") => {
    const url =
      kind === "terms"
        ? process.env.EXPO_PUBLIC_TERMS_URL
        : process.env.EXPO_PUBLIC_PRIVACY_URL;
    if (url) {
      void Linking.openURL(url);
    } else {
      showToast({
        variant: "info",
        message: t("auth.legalPagesUnavailable"),
        durationMs: 3200,
      });
    }
  };

  const openContact = () => {
    const url = process.env.EXPO_PUBLIC_CONTACT_URL;
    if (url) {
      void Linking.openURL(url);
      return;
    }
    showToast({
      variant: "info",
      message: t("settings.contactUnavailable"),
      durationMs: 3200,
    });
  };

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await performSignOut();
      queryClient.clear();
      setConfirmAction(null);
      router.replace("/welcome");
    } catch (e) {
      console.error("[settings] signOut", e);
      showToast({
        variant: "error",
        message: t("settings.signOutFailed"),
        durationMs: 3200,
      });
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
      showToast({
        variant: "error",
        message: t("settings.deleteFailed"),
        durationMs: 3200,
      });
    } finally {
      setIsDeletingAccount(false);
    }
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
          style={{ paddingVertical: 16 }}
          onPress={() => router.push("/(private)/(tabs)/profile/edit" as const)}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.editProfile")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: 16 }}
          onPress={() => openLegal("privacy")}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.privacy")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: 16 }}
          onPress={() => openLegal("terms")}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.termsAndPolicies")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ paddingVertical: 16 }} onPress={openContact}>
          <Text style={{ color: colors.onSurface }}>
            {t("settings.contactUs")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: 16 }}
          onPress={() => setAboutVisible(true)}
        >
          <Text style={{ color: colors.onSurface }}>
            {t("settings.aboutUs")}
          </Text>
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
      </ScrollView>

      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={aboutStyles.root}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAboutVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          />
          <View style={aboutStyles.cardWrap} pointerEvents="box-none">
            <View
              style={[
                aboutStyles.card,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View
                style={{ alignItems: "center", gap: 14, paddingVertical: 4 }}
              >
                <LocalSvg asset={ABOUT_LOGO_SVG} width={88} height={88} />
                <AppText
                  variant="title"
                  color={colors.primary}
                  style={{ textAlign: "center" }}
                >
                  {t("app.name")}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.onSurfaceVariant}
                  style={{ textAlign: "center", lineHeight: 18 }}
                >
                  {t("settings.aboutUsCopyright", {
                    year: new Date().getFullYear(),
                    appName: t("app.name"),
                  })}
                </AppText>
                <TouchableOpacity
                  onPress={() => void Linking.openURL(websiteUrl)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="link"
                  accessibilityLabel="pawtaker.ca"
                >
                  <AppText
                    variant="caption"
                    color={colors.primary}
                    style={{
                      textDecorationLine: "underline",
                      fontWeight: "600",
                    }}
                  >
                    pawtaker.ca
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <SettingsMenuOverlay
        openMenu={openMenu}
        menuPosition={menuPosition}
        colors={colors}
        t={t as any}
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
    </View>
  );
}

const aboutStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  cardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    maxWidth: 360,
    width: "100%",
    marginHorizontal: 24,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
