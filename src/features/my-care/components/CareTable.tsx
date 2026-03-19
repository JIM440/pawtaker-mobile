import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Handshake, PawPrint } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface CareRow {
    id: string;
    personName: string;
    personAvatar: string;
    handshakes: number;
    paws: number;
    pet: string;
    careType: string;
    date: string;
}

interface CareTableProps {
    colors: any;
    rows: CareRow[];
    headerLabel: string;
    footerText?: React.ReactNode;
}

export function CareTable({ colors, rows, headerLabel, footerText }: CareTableProps) {
    return (
        <View style={styles.tableContainer}>
            <View style={[styles.tableSubHeader]}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colOwner}>{headerLabel}</AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colPet}>Pet</AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colType}>Care type</AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.colDate}>Date</AppText>
            </View>
            {rows.map((row) => (
                <View key={row.id} style={styles.tableBodyRow}>
                    <View style={styles.colOwner}>
                        <AppImage
                            source={{ uri: row.personAvatar }}
                            style={styles.rowAvatar}
                            contentFit="cover"
                        />
                        <View style={styles.rowOwnerDetails}>
                            <AppText variant="body" style={{ fontSize: 13, fontWeight: '600', lineHeight: 14 }} numberOfLines={1}>{row.personName}</AppText>
                            <View style={styles.miniStatsBadge}>
                                <View className="flex-row items-center gap-1" style={{
                                    backgroundColor: colors.surfaceBright, paddingHorizontal: 4,
                                    paddingVertical: 2, borderRadius: 12
                                }}>
                                    <Handshake size={10} color={colors.tertiary} />
                                    <AppText variant="caption" style={{ fontSize: 10 }}>{row.handshakes}</AppText>
                                </View>
                                <View className="flex-row items-center gap-1" style={{ backgroundColor: colors.surfaceBright, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 12 }}>
                                    <PawPrint size={10} color={colors.tertiary} />
                                    <AppText variant="caption" style={{ fontSize: 10 }}>{row.paws}</AppText>
                                </View>
                            </View>
                        </View>
                    </View>
                    <AppText variant="caption" style={styles.colPet} numberOfLines={1}>{row.pet}</AppText>
                    <AppText variant="caption" style={styles.colType} numberOfLines={1}>{row.careType}</AppText>
                    <AppText variant="caption" style={styles.colDate} numberOfLines={1}>{row.date}</AppText>
                </View>
            ))}
            {footerText && (
                <View className="py-8 items-center">
                    <AppText variant="caption" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>
                        {footerText}
                    </AppText>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tableContainer: {
        marginHorizontal: -16,
    },
    tableSubHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    tableBodyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    colOwner: {
        flex: 2, // Increased as requested
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    colPet: {
        flex: 0.8,
    },
    colType: {
        flex: 1,
    },
    colDate: {
        flex: 0.7, // Decreased as requested
        textAlign: 'right',
    },
    rowAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    rowOwnerDetails: {
        flex: 1,
        gap: 2,
    },
    miniStatsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
});
