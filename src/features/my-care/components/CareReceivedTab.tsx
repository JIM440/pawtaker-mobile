import { AppText } from '@/src/shared/components/ui/AppText';
import React from 'react';
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
    if (loading) {
        return <CareTableSkeleton colors={colors} rowCount={5} />;
    }
    if (rows.length === 0) {
        return <EmptyState variant="received" />;
    }

    const footer = (
        <>
            Give more care to earn more points.{"\n"}
            Points may be convertible to cash. <AppText variant="caption" style={{ textDecorationLine: 'underline' }}>Find out how</AppText>
        </>
    );

    return (
        <CareTable
            colors={colors}
            rows={rows}
            headerLabel="Taker"
            footerText={footer}
            onPressPerson={onPressPerson}
            onPressPet={onPressPet}
        />
    );
}
