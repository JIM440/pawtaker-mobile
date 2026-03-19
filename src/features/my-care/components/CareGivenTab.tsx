import React from 'react';
import { CareRow, CareTable } from './CareTable';
import { EmptyState } from './EmptyState';

export interface CareRowGivven {
    id: string;
    ownerName: string;
    ownerAvatar: string;
    handshakes: number;
    paws: number;
    pet: string;
    careType: string;
    date: string;
}

interface CareGivenTabProps {
    colors: any;
    rows: CareRowGivven[];
}

export function CareGivenTab({ colors, rows }: CareGivenTabProps) {
    if (rows.length === 0) {
        return <EmptyState colors={colors} variant="given" />;
    }

    const tableRows: CareRow[] = rows.map(r => ({
        id: r.id,
        personName: r.ownerName,
        personAvatar: r.ownerAvatar,
        handshakes: r.handshakes,
        paws: r.paws,
        pet: r.pet,
        careType: r.careType,
        date: r.date,
    }));

    return (
        <CareTable
            colors={colors}
            rows={tableRows}
            headerLabel="Pet owner"
        />
    );
}
