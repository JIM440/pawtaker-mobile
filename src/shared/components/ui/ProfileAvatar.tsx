import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, View } from "react-native";
import { AppImage } from "./AppImage";
import { AppText } from "./AppText";

type ProfileAvatarProps = {
    uri?: string | null;
    name?: string;
    size?: number;
    style?: any;
};

/**
 * Reusable profile avatar component.
 * Displays an image if URI is provided, otherwise shows name initials
 * with a themed background (surfaceDim).
 */
export function ProfileAvatar({
    uri,
    name,
    size = 40,
    style,
}: ProfileAvatarProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    const initials = name
        ? name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";

    if (!uri) {
        return (
            <View
                style={[
                    styles.container,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: (colors as any).surfaceDim,
                    },
                    style,
                ]}
            >
                <AppText
                    style={{
                        fontSize: size * 0.4,
                        fontWeight: "600",
                        color: colors.onSurface,
                    }}
                >
                    {initials}
                </AppText>
            </View>
        );
    }

    return (
        <AppImage
            source={{ uri }}
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
});
