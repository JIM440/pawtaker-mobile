import React from "react";
import { CareRow, CareTable } from "./CareTable";
import { CareTableSkeleton } from "./CareTableSkeleton";
import { EmptyState } from "./EmptyState";

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
  loading?: boolean;
}

export function CareGivenTab({
  colors,
  rows,
  loading = false,
}: CareGivenTabProps) {
  if (loading) {
    return <CareTableSkeleton colors={colors} rowCount={5} />;
  }
  if (rows.length === 0) {
    return <EmptyState variant="given" />;
  }

  const tableRows: CareRow[] = rows.map((r) => ({
    id: r.id,
    personName: r.ownerName,
    personAvatar: r.ownerAvatar,
    handshakes: r.handshakes,
    paws: r.paws,
    pet: r.pet,
    careType: r.careType,
    date: r.date,
  }));

  return <CareTable colors={colors} rows={tableRows} headerLabel="Pet owner" />;
}
