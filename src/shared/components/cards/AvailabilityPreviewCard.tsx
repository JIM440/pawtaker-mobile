import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { ProfileAvatar } from "@/src/shared/components/ui/ProfileAvatar";
import { Handshake, MapPin, PawPrint, Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

export type AvailabilityPreviewCardProps = {
    avatarUri: string | null;
    name: string;
    rating: number;
    handshakes: number;
    paws: number;
    isAvailable: boolean;
    petTypes: string[];
    services: string[];
    location: string;
};

export function AvailabilityPreviewCard({
    avatarUri,
    name,
    rating,
    handshakes,
    paws,
    isAvailable,
    petTypes,
    services,
    location,
}: AvailabilityPreviewCardProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.outlineVariant,
                },
            ]}
        >
            <View style={styles.header}>
                <ProfileAvatar
                    uri={avatarUri}
                    name={name}
                    size={80}
                />
                <View style={styles.titleCol}>
                    <View style={styles.nameRow}>
                        <AppText
                            variant="title"
                            color={colors.onSurface}
                            style={styles.name}
                            numberOfLines={1}
                        >
                            {name}
                        </AppText>
                        {isAvailable && (
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: colors.tertiaryContainer },
                                ]}
                            >
                                <AppText variant="caption" color={colors.onTertiaryContainer}>
                                    Available
                                </AppText>
                            </View>
                        )}
                    </View>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <AppText variant="caption" color={colors.onSurface}>
                                {rating.toFixed(1)}
                            </AppText>
                            <Star size={12} color={colors.tertiary} fill={colors.tertiary} />
                        </View>
                        <View style={styles.metaItem}>
                            <Handshake size={12} color={colors.tertiary} />
                            <AppText variant="caption" color={colors.tertiary}>
                                {handshakes}
                            </AppText>
                        </View>
                        <View style={styles.metaItem}>
                            <PawPrint size={12} color={colors.tertiary} />
                            <AppText variant="caption" color={colors.tertiary}>
                                {paws}
                            </AppText>
                        </View>
                    </View>
                    <View style={styles.tagsRow}>
                        <AppText
                            variant="caption"
                            style={[
                                styles.tags,
                                { backgroundColor: colors.surfaceContainer },
                            ]}
                            numberOfLines={1}
                        >
                            {petTypes.join(" • ")}
                        </AppText>
                        <AppText
                            variant="caption"
                            style={[
                                styles.tags,
                                { backgroundColor: colors.surfaceContainer },
                            ]}
                            numberOfLines={1}
                        >
                            {services.join(" • ")}
                        </AppText>
                        <View
                            style={[
                                styles.locationRow,
                                { backgroundColor: colors.surfaceContainer },
                            ]}
                        >
                            <MapPin size={16} color={colors.onSurfaceVariant} />
                            <AppText variant="caption" numberOfLines={1}>
                                {location}
                            </AppText>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
    },
    header: {
        flexDirection: "row",
        gap: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    titleCol: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    name: {
        fontSize: 16,
        flexShrink: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 2,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    tagsRow: {
        gap: 4,
        marginTop: 6,
    },
    tags: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
    },
});
