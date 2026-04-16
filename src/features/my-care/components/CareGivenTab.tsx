import React from "react";
import { useTranslation } from "react-i18next";
import { CareRow, CareTable } from "./CareTable";
import { CareTableSkeleton } from "./CareTableSkeleton";
import { EmptyState } from "./EmptyState";

export interface CareRowGivven {
  id: string;
  ownerName: string;
  ownerAvatar: string;
  ownerId?: string;
  handshakes: number;
  paws: number;
  pet: string;
  petId?: string;
  careType: string;
  date: string;
  contractId?: string;
}

interface CareGivenTabProps {
  colors: any;
  rows: CareRowGivven[];
  loading?: boolean;
  onPressPerson?: (row: CareRow) => void;
  onPressPet?: (row: CareRow) => void;
}

export function CareGivenTab({
  colors,
  rows,
  loading = false,
  onPressPerson,
  onPressPet,
}: CareGivenTabProps) {
  const { t } = useTranslation();
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
    personId: r.ownerId,
    handshakes: r.handshakes,
    paws: r.paws,
    pet: r.pet,
    petId: r.petId,
    careType: r.careType,
    date: r.date,
    contractId: r.contractId,
  }));

  return (
    <CareTable
      colors={colors}
      rows={tableRows}
      headerLabel={t("pet.detail.petOwner")}
      onPressPerson={onPressPerson}
      onPressPet={onPressPet}
    />
  );
}
