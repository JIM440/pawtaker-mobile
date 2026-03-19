import { AppText } from '@/src/shared/components/ui/AppText';
import React from 'react';
import { CareRow, CareTable } from './CareTable';

const MOCK_CARE_RECEIVED_ROWS = [
    {
        id: '1',
        takerName: 'Alice Morgan',
        takerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        handshakes: 12,
        paws: 17,
        pet: 'Polo',
        careType: 'Daytime',
        date: 'Mar 14-18',
    },
    {
        id: '2',
        takerName: 'Jane Ambers',
        takerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
        handshakes: 12,
        paws: 17,
        pet: 'Luna',
        careType: 'Overnight',
        date: 'Mar 18',
    },
    {
        id: '3',
        takerName: 'Elsa Magomette',
        takerAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=200',
        handshakes: 12,
        paws: 17,
        pet: 'Polo',
        careType: 'Play/walk',
        date: 'Feb 14-18',
    }
];

interface CareReceivedTabProps {
    colors: any;
}

export function CareReceivedTab({ colors }: CareReceivedTabProps) {
    const tableRows: CareRow[] = MOCK_CARE_RECEIVED_ROWS.map(r => ({
        id: r.id,
        personName: r.takerName,
        personAvatar: r.takerAvatar,
        handshakes: r.handshakes,
        paws: r.paws,
        pet: r.pet,
        careType: r.careType,
        date: r.date,
    }));

    const footer = (
        <>
            Give more care to earn more points.{"\n"}
            Points may be convertible to cash. <AppText variant="caption" style={{ textDecorationLine: 'underline' }}>Find out how</AppText>
        </>
    );

    return (
        <CareTable
            colors={colors}
            rows={tableRows}
            headerLabel="Taker"
            footerText={footer}
        />
    );
}
