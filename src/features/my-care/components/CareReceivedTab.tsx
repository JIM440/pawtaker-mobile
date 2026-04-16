import { AppText } from '@/src/shared/components/ui/AppText';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CareRow, CareTable } from './CareTable';
import { EmptyState } from './EmptyState';
import { CareTableSkeleton } from "./CareTableSkeleton";

interface CareReceivedTabProps {
    colors: any;
    rows: CareRow[];
    loading?: boolean;
    onPressPerson?: (row: CareRow) => void;
    onPressPet?: (row: CareRow) => void;
}

export function CareReceivedTab({
    colors,
    rows,
    loading = false,
    onPressPerson,
    onPressPet,
}: CareReceivedTabProps) {
    const { t } = useTranslation();
    if (loading) {
        return <CareTableSkeleton colors={colors} rowCount={5} />;
    }
    if (rows.length === 0) {
        return <EmptyState variant="received" />;
    }

    const footer = (
        <View style={{ alignItems: "center", gap: 6 }}>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={{ textAlign: "center" }}>
                {t("myCare.receivedFooterLine1")}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={{ textAlign: "center" }}>
                {t("myCare.receivedFooterLine2Prefix")}
                <AppText variant="caption" style={{ textDecorationLine: "underline" }}>
                    {t("myCare.receivedFooterLink")}
                </AppText>
            </AppText>
        </View>
    );

    return (
        <CareTable
            colors={colors}
            rows={rows}
            headerLabel={t("myCare.table.taker")}
            footerText={footer}
            onPressPerson={onPressPerson}
            onPressPet={onPressPet}
        />
    );
}
