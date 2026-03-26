import { AppText } from '@/src/shared/components/ui/AppText';
import React from 'react';
import { CareRow, CareTable } from './CareTable';
import { EmptyState } from './EmptyState';

interface CareReceivedTabProps {
    colors: any;
    rows: CareRow[];
}

export function CareReceivedTab({ colors, rows }: CareReceivedTabProps) {
    if (rows.length === 0) {
        return <EmptyState colors={colors} variant="received" />;
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
        />
    );
}
