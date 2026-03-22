import i18n from "@/src/lib/i18n";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/src/constants/colors";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useLanguageStore } from "@/src/lib/store/language.store";
import { useThemeStore } from "@/src/lib/store/theme.store";

import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { ChevronDown } from "lucide-react-native";
import { LocalSvg } from "react-native-svg/css";

/** primary_logo.svg viewBox 388.09 × 97.73 */
const LOGO_W = 280;
const LOGO_H = 180;
const PRIMARY_LOGO = require("@/assets/icons/logos/svg/narrow_variant.svg");

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const setGuestMode = useAuthStore((s) => s.setGuestMode);

  const { language, setLanguage } = useLanguageStore();

  const languageButtonRef = useRef<View | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const languageLabel = useMemo(
    () =>
      language === "fr"
        ? t("settings.languageFrench", "Français")
        : t("settings.languageEnglish", "English"),
    [language, t],
  );

  const menuItems = useMemo(
    () => [
      { id: "en" as const, label: t("settings.languageEnglish", "English") },
      { id: "fr" as const, label: t("settings.languageFrench", "Français") },
    ],
    [t],
  );

  return (
    <PageContainer
      contentStyle={{ paddingTop: 32, paddingBottom: 32 }}
      scrollable={true}
    >
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "flex-end",
          marginBottom: 10,
        }}
      >
        <TouchableOpacity
          ref={languageButtonRef}
          accessibilityRole="button"
          accessibilityLabel={t("settings.language")}
          accessibilityHint={t("auth.welcome.languageHint")}
          onPress={() => {
            languageButtonRef.current?.measureInWindow(
              (x, y, width, height) => {
                setMenuPosition({ x, y, width, height });
                setOpenMenu(true);
              },
            );
          }}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.onSurface }}>
            {languageLabel}
          </Text>
          <ChevronDown
            size={14}
            color={colors.onSurfaceVariant}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flex: 1,
          width: "100%",
          gap: 24,
          paddingTop: 32,
        }}
      >
        <LocalSvg
          asset={PRIMARY_LOGO}
          width={LOGO_W}
          height={LOGO_H}
          style={{
            alignSelf: "center",
          }}
        />

        <AppText
          variant="headline"
          color={colors.onSurface}
          style={{
            textAlign: "center",
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          {t("auth.welcome.title")}
        </AppText>

        <Button
          label={t("auth.welcome.signIn")}
          onPress={() => router.push("/login")}
          variant="outline"
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            marginTop: 2,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.outlineVariant,
            }}
          />
          <AppText
            variant="label"
            color={colors.onSurface}
            style={{ marginHorizontal: 10 }}
          >
            {t("common.or")}
          </AppText>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.outlineVariant,
            }}
          />
        </View>

        <Button
          label={t("auth.welcome.getStarted")}
          onPress={() => router.push("/signup")}
          variant="primary"
        />

        <TouchableOpacity
          onPress={() => {
            setGuestMode(true);
            router.replace("/(private)/(tabs)" as Parameters<typeof router.replace>[0]);
          }}
          style={{ marginTop: 26 }}
        >
          <AppText
            variant="body"
            color={colors.onSurface}
            style={{ textAlign: "center", fontSize: 14 }}
          >
            {t("auth.welcome.continueWithoutSigningIn")}
          </AppText>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={openMenu}
        animationType="fade"
        onRequestClose={() => setOpenMenu(false)}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpenMenu(false)}
          />
          {menuPosition ? (
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              <View
                style={{
                  position: "absolute",
                  top: menuPosition.y + menuPosition.height + 30,
                  right: 20,
                  width: 180,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceContainerLowest,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 12 },
                  shadowRadius: 16,
                  elevation: 6,
                  overflow: "hidden",
                }}
              >
                {menuItems.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setLanguage(item.id);
                      i18n.changeLanguage(item.id);
                      setOpenMenu(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: idx === 0 ? 1 : 0,
                      borderBottomColor: colors.outlineVariant,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.onSurface }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </PageContainer>
  );
}
