import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      <BackHeader />
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surfaceContainer,
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 24,
            maxWidth: 360,
            width: "100%",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AppText variant="headline" style={{ fontSize: 22, marginBottom: 4 }}>
            {t("notFound.title")}
          </AppText>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ fontSize: 12, textAlign: "center", marginBottom: 16 }}
          >
            {t("notFound.message")}
          </AppText>

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 4,
              width: "100%",
            }}
          >
            <Button
              label={t("common.goHome")}
              fullWidth
              onPress={() => router.replace("/(private)/(tabs)")}
              style={{ flex: 1 }}
            />
            <Button
              label={t("common.back")}
              variant="outline"
              fullWidth
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </PageContainer>
  );
}
