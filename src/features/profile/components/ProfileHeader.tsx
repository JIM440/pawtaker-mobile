import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import {
    Activity,
    BadgeCheck,
    Handshake,
    MapPin,
    PawPrint,
    Star,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ProfileHeaderProps {
    name: string;
    avatarUri?: string | null;
    location: string;
    points: number;
    handshakes: number;
    paws: number;
    rating: number;
    currentTask?: string;
    isAvailable?: boolean;
    isVerified?: boolean;
    onAvatarPress?: () => void;
}

export function ProfileHeader({
    name,
    avatarUri,
    location,
    points,
    handshakes,
    paws,
    rating,
    currentTask,
    isAvailable = false,
    isVerified = false,
    onAvatarPress,
}: ProfileHeaderProps) {
    const { t } = useTranslation();
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.avatarWrap}
                onPress={onAvatarPress}
            >
                <UserAvatar
                    uri={avatarUri}
                    name={name}
                    size={80}
                    showOnlineBadge={false}
                />
            </TouchableOpacity>

            {isAvailable && (
                <View
                    style={[
                        styles.availablePill,
                        { backgroundColor: colors.tertiaryContainer },
                    ]}
                >
                    <AppText variant="caption" color={colors.onTertiaryContainer}>
                        {t("availability.available", "Available")}
                    </AppText>
                </View>
            )}

            <View style={styles.nameRow}>
                <AppText variant="headline" style={styles.userName}>
                    {name}
                </AppText>
                {isVerified && (
                    <BadgeCheck
                        size={24}
                        color={colors.surfaceContainerLowest}
                        fill={colors.primary}
                    />
                )}
            </View>

            <View style={styles.locationRow}>
                <MapPin size={20} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                    {location}
                </AppText>
            </View>

            <View style={styles.statsRow}>
                <View
                    style={[
                        styles.statPill,
                        { backgroundColor: colors.surfaceContainerHighest },
                    ]}
                >
                    <Activity size={12} color={colors.onSurfaceVariant} />
                    <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                        style={styles.statText}
                    >
                        {points} Points
                    </AppText>
                </View>
                <View
                    style={[
                        styles.statPill,
                        { backgroundColor: colors.surfaceContainerHighest },
                    ]}
                >
                    <View
                        style={[
                            styles.statInner,
                            {
                                backgroundColor: colors.tertiaryContainer,
                                borderColor: colors.outlineVariant,
                            },
                        ]}
                    >
                        <Handshake size={12} color={colors.tertiary} />
                        <AppText
                            variant="caption"
                            color={colors.tertiary}
                            style={styles.statText}
                        >
                            {handshakes}
                        </AppText>
                    </View>
                    <View
                        style={[
                            styles.statInner,
                            {
                                backgroundColor: colors.secondaryContainer,
                                borderColor: colors.outlineVariant,
                            },
                        ]}
                    >
                        <PawPrint size={12} color={colors.onSurfaceVariant} />
                        <AppText
                            variant="caption"
                            color={colors.onSecondaryContainer}
                            style={styles.statText}
                        >
                            {paws}
                        </AppText>
                    </View>
                </View>
                <View
                    style={[
                        styles.statPill,
                        { backgroundColor: colors.surfaceContainerHighest },
                    ]}
                >
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                        {rating.toFixed(1)}
                    </AppText>
                    <Star size={12} color={colors.primary} fill={colors.primary} />
                </View>
            </View>

            {currentTask && (
                <View
                    style={[
                        styles.currentTaskPill,
                        { backgroundColor: colors.surfaceContainerHighest },
                    ]}
                >
                    <AppText
                        variant="caption"
                        color={colors.onSurface}
                        style={{ fontWeight: "600" }}
                    >
                        {currentTask}
                    </AppText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    avatarWrap: {
        marginBottom: 8,
    },
    availablePill: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 6,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch",
        gap: 6,
        marginBottom: 4,
        paddingHorizontal: 8,
    },
    userName: {
        flexShrink: 1,
        textAlign: "center",
        fontSize: 28,
        letterSpacing: -0.5,
        lineHeight: 36,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
        marginBottom: 8,
    },
    statText: {
        fontSize: 9,
        lineHeight: 16,
    },
    statPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    statInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
    },
    currentTaskPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 99,
    },
});
