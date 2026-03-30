import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  openMenu: "theme" | "language" | null;
  menuPosition: { x: number; y: number; width: number; height: number } | null;
  colors: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onTheme: (theme: "system" | "light" | "dark") => void;
  onLanguage: (lang: "en" | "fr") => void;
};

export function SettingsMenuOverlay({
  openMenu,
  menuPosition,
  colors,
  t,
  onClose,
  onTheme,
  onLanguage,
}: Props) {
  return (
    <Modal transparent visible={!!openMenu} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        {menuPosition ? (
          <View
            style={{
              position: "absolute",
              top: menuPosition.y + menuPosition.height + 36,
              right: 24,
              width: 150,
              borderRadius: 12,
              backgroundColor: colors.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              overflow: "hidden",
            }}
            onStartShouldSetResponder={() => true}
          >
            {openMenu === "theme" ? (
              <>
                <Pressable
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.outlineVariant,
                  }}
                  onPress={() => onTheme("system")}
                >
                  <Text style={{ color: colors.onSurface }}>{t("settings.themeSystem")}</Text>
                </Pressable>
                <Pressable
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.outlineVariant,
                  }}
                  onPress={() => onTheme("light")}
                >
                  <Text style={{ color: colors.onSurface }}>{t("settings.themeLight")}</Text>
                </Pressable>
                <Pressable
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                  onPress={() => onTheme("dark")}
                >
                  <Text style={{ color: colors.onSurface }}>{t("settings.themeDark")}</Text>
                </Pressable>
              </>
            ) : null}

            {openMenu === "language" ? (
              <>
                <Pressable
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.outlineVariant,
                  }}
                  onPress={() => onLanguage("en")}
                >
                  <Text style={{ color: colors.onSurface }}>
                    {t("settings.languageEnglish")}
                  </Text>
                </Pressable>
                <Pressable
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                  onPress={() => onLanguage("fr")}
                >
                  <Text style={{ color: colors.onSurface }}>
                    {t("settings.languageFrench")}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}
