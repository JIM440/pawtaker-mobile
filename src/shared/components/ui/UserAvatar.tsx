import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { AppImage } from "./AppImage";
import { AppText } from "./AppText";

interface UserAvatarProps {
    uri?: string | null;
    name?: string;
    size?: number;
    style?: ViewStyle;
    showOnlineBadge?: boolean;
}

export function UserAvatar({
    uri,
    name,
    size = 40,
    style,
    showOnlineBadge = false,
}: UserAvatarProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    const getInitials = (userName?: string) => {
        if (!userName) return "";
        const parts = userName.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };

    const content = uri ? (
        <AppImage
            source={{ uri }}
            style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
            contentFit="cover"
        />
    ) : (
        <View
            style={[
                styles.initialsContainer,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.surfaceDim,
                },
            ]}
        >
            <AppText
                style={{
                    fontSize: size * 0.4,
                    lineHeight: size * 0.4,
                    fontWeight: "600",
                }}
                color={colors.onSurfaceVariant}
            >
                {getInitials(name)}
            </AppText>
        </View>
    );

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            {content}
            {showOnlineBadge && (
                <View
                    style={[
                        styles.onlineBadge,
                        {
                            backgroundColor: colors.primary,
                            width: size * 0.25,
                            height: size * 0.25,
                            borderRadius: (size * 0.25) / 2,
                            borderWidth: 2,
                            borderColor: colors.surface,
                        },
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        overflow: "hidden",
    },
    image: {
        backgroundColor: "transparent",
    },
    initialsContainer: {
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    onlineBadge: {
        position: "absolute",
        right: 0,
        bottom: 0,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
});
