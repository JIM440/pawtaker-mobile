import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Calendar, Clock, MoreHorizontal } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

interface LikedPetCardProps {
    colors: any;
    imageSource: any;
    petName: string;
    breed: string;
    petType: string;
    dateRange: string;
    time: string;
    description: string;
    tags: string[];
    onApply: () => void;
    onRemove: () => void;
    isSeeking?: boolean;
}

export function LikedPetCard({
    colors,
    imageSource,
    petName,
    breed,
    petType,
    dateRange,
    time,
    description,
    tags,
    onApply,
    onRemove,
    isSeeking = false,
}: LikedPetCardProps) {
    const [menuVisible, setMenuVisible] = useState(false);
    const menuRef = useRef<View>(null);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const handleOpenMenu = () => {
        menuRef.current?.measureInWindow((x, y, width, height) => {
            setMenuPos({ x, y: y + height });
            setMenuVisible(true);
        });
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}>
            <AppImage
                source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
                style={styles.image}
                contentFit="cover"
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.nameGroup}>
                        <AppText variant="bodyLarge" style={styles.petName}>{petName}</AppText>
                        {isSeeking && (
                            <View style={[styles.badge, { backgroundColor: colors.tertiaryContainer }]}>
                                <AppText variant="caption" style={{ color: colors.onTertiaryContainer, fontSize: 10, fontWeight: '700' }}>Seeking</AppText>
                            </View>
                        )}
                    </View>
                    <View ref={menuRef} collapsable={false}>
                        <TouchableOpacity onPress={handleOpenMenu}>
                            <MoreHorizontal size={20} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    </View>
                </View>

                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.breedText}>
                    {breed} • {petType}
                </AppText>

                {isSeeking && (
                    <View style={styles.scheduleRow}>
                        <View style={styles.scheduleItem}>
                            <Calendar size={14} color={colors.onSurfaceVariant} />
                            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.scheduleText}>{dateRange}</AppText>
                        </View>
                        <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
                        <View style={styles.scheduleItem}>
                            <Clock size={14} color={colors.onSurfaceVariant} />
                            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.scheduleText}>{time}</AppText>
                        </View>
                    </View>
                )}

                <AppText variant="caption" color={colors.onSurfaceVariant} numberOfLines={2} style={styles.description}>
                    {description}
                </AppText>

                <View style={styles.tagsContainer}>
                    {tags.map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: colors.surfaceContainerHighest }]}>
                            <AppText variant="caption" style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{tag}</AppText>
                        </View>
                    ))}
                </View>
            </View>

            {/* Menu Modal */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
                    <View
                        style={[
                            styles.menuContent,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.outlineVariant,
                                top: menuPos.y + 4,
                                right: 16,
                            }
                        ]}
                    >
                        {isSeeking && (
                            <>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                        setMenuVisible(false);
                                        onApply();
                                    }}
                                >
                                    <AppText variant="body">Apply</AppText>
                                </TouchableOpacity>
                                <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />
                            </>
                        )}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                setMenuVisible(false);
                                onRemove();
                            }}
                        >
                            <AppText variant="body" color={colors.error}>Remove from Liked</AppText>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        gap: 12,
    },
    image: {
        width: 86,
        height: 86,
        borderRadius: 12,
    },
    content: {
        flex: 1,
        gap: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nameGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    petName: {
        fontWeight: '700',
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    breedText: {
        fontSize: 12,
        marginBottom: 2,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    scheduleText: {
        fontSize: 11,
    },
    description: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menuContent: {
        position: 'absolute',
        width: 200,
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuDivider: {
        height: 1,
    },
});
