import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Handshake, MapPin, MoreHorizontal, PawPrint, Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type TakerCardProps = {
    taker: {
        id: string;
        name: string;
        avatar: string;
        rating: number;
        species: string;
        tags: string[];
        location: string;
        distance: string;
        status: "available" | "unavailable";
        completedTasks?: number;
        petsHandled?: number;
    };
    onPress: () => void;
    onMenuPress: (ref: any) => void;
};

export function TakerCard({ taker, onPress, onMenuPress }: TakerCardProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];
    const menuBtnRef = React.useRef<any>(null);

    // Figma-like colors for specific elements
    const pillBg = colors.surfaceContainer;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="flex-row rounded-[16px] px-4 py-4"
            style={[styles.card, { backgroundColor: colors.surfaceBright }]}
        >
            <View className="mr-4">
                <AppImage
                    source={{ uri: taker.avatar }}
                    contentFit="cover"
                    style={[
                        styles.takerAvatar,
                        { backgroundColor: colors.surfaceContainer },
                    ]}
                />
            </View>
            <View className="flex-1">
                {/* Header: Name, Status, Menu */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                        <AppText
                            variant="title"
                            numberOfLines={1}
                            style={{
                                fontSize: 16,
                                fontWeight: "700",
                                letterSpacing: -0.2,
                            }}
                        >
                            {taker.name}
                        </AppText>
                        {taker.status === "available" && (
                            <View
                                className="p-[4px] rounded-[8px]"
                                style={{ backgroundColor: colors.tertiaryContainer }}
                            >
                                <AppText
                                    variant="caption"
                                    style={{
                                        color: colors.onTertiaryContainer,
                                        fontSize: 11
                                    }}
                                >
                                    Available
                                </AppText>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity
                        ref={menuBtnRef}
                        onPress={() => onMenuPress(menuBtnRef.current)}
                        hitSlop={8}
                        className="p-1"
                    >
                        <MoreHorizontal size={24} color={colors.onSurface} />
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View className="flex-row items-center gap-2">
                    <View style={[styles.statPill, { backgroundColor: pillBg }]}>
                        <AppText variant="caption" style={styles.statText}>
                            {taker.rating.toFixed(1)}
                        </AppText>
                        <Star size={14} color={colors.tertiary} fill={colors.tertiary} />
                    </View>
                    <View style={[styles.statPill, { backgroundColor: pillBg }]}>
                        <Handshake size={14} color={colors.onSurfaceVariant} strokeWidth={2.5} />
                        <AppText variant="caption" color={colors.onSurface} style={styles.statText}>
                            {taker.completedTasks ?? 0}
                        </AppText>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: pillBg }]}>
                        <PawPrint size={14} color={colors.onSurfaceVariant} strokeWidth={2.5} />
                        <AppText variant="caption" color={colors.onSurface} style={styles.statText}>
                            {taker.petsHandled ?? 0}
                        </AppText>
                    </View>
                </View>

                <View className="flex-row gap-2 my-1">
                    {/* Species Pill */}
                    <View className="flex-row">
                        <View style={[styles.tagPill, { backgroundColor: pillBg }]}>
                            <AppText variant="caption" color={colors.onSurface} style={styles.tagText}>
                                {taker.species}
                            </AppText>
                        </View>
                    </View>

                    {/* Tags Pill (Care Types) */}
                    {taker.tags.length > 0 && (
                        <View className="flex-row">
                            <View style={[styles.tagPill, { backgroundColor: pillBg }]}>
                                <AppText variant="caption" color={colors.onSurface} style={styles.tagText}>
                                    {taker.tags.join(" • ")}
                                </AppText>
                            </View>
                        </View>
                    )}
                </View>

                {/* Location Pill */}
                <View className="flex-row">
                    <View style={[styles.locationPill, { backgroundColor: pillBg }]}>
                        <MapPin size={18} color={colors.onSurfaceVariant} />
                        <AppText
                            variant="caption"
                            color={colors.onSurface}
                            numberOfLines={1}
                            style={{ flexShrink: 1, fontSize: 12 }}
                        >
                            {taker.location} • {taker.distance}
                        </AppText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
    },
    takerAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    statPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statText: {
        fontSize: 12,
    },
    tagPill: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
    },
    locationPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 20,
        flexShrink: 1,
    },
});
