import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { ChipSelector } from "@/src/shared/components/ui/ChipSelector";
import { Input } from "@/src/shared/components/ui/Input";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

interface PetFormFieldsProps {
    petName: string;
    setPetName: (v: string) => void;
    petBio: string;
    setPetBio: (v: string) => void;
    yardType: string | null;
    setYardType: (v: string) => void;
    ageRange: string | null;
    setAgeRange: (v: string) => void;
    energyLevel: string | null;
    setEnergyLevel: (v: string) => void;
    specialNeeds: boolean;
    setSpecialNeeds: (v: boolean) => void;
    specialNeedsText?: string;
    setSpecialNeedsText?: (v: string) => void;
    /** If true, uses standard primary chips. If false, uses variant='surface' for subtle integration. */
    premiumStyle?: boolean;
}

export function PetFormFields({
    petName,
    setPetName,
    petBio,
    setPetBio,
    yardType,
    setYardType,
    ageRange,
    setAgeRange,
    energyLevel,
    setEnergyLevel,
    specialNeeds,
    setSpecialNeeds,
    specialNeedsText,
    setSpecialNeedsText,
    premiumStyle = true,
}: PetFormFieldsProps) {
    const { t } = useTranslation();
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    const chipVariant = premiumStyle ? "primary" : "surface";

    return (
        <View style={styles.container}>
            <View style={styles.field}>
                <Input
                    label={t("pets.add.name", "Pet name")}
                    value={petName}
                    onChangeText={setPetName}
                    maxLength={50}
                    containerStyle={{ marginBottom: 0 }}
                />
                <AppText
                    variant="caption"
                    color={colors.onSurfaceVariant}
                    style={styles.helperText}
                >
                    {petName.length}/50
                </AppText>
            </View>

            <View style={styles.field}>
                <Input
                    label={t("pets.add.bio", "Pet Short Bio")}
                    value={petBio}
                    onChangeText={setPetBio}
                    inputStyle={styles.textArea}
                    multiline
                    maxLength={300}
                    containerStyle={{ marginBottom: 0 }}
                />
                <AppText
                    variant="caption"
                    color={colors.onSurfaceVariant}
                    style={styles.helperText}
                >
                    {petBio.length}/300
                </AppText>
            </View>
            <AppText variant='label' style={{ marginTop: 16 }}>{t("pets.edit.details", "Details")}</AppText>
            <ChipSelector
                label={t("pets.add.yardType", "Yard Type")}
                options={["indoors only", "fenced yard", "small yard", "high fence"]}
                selectedOption={yardType}
                onSelect={setYardType}
                variant={chipVariant}
            />

            <ChipSelector
                label={t("pets.add.age", "Age")}
                options={["0-1yr", "1-3yrs", "3-8yrs", "8+ yrs"]}
                selectedOption={ageRange}
                onSelect={setAgeRange}
                variant={chipVariant}
            />

            <ChipSelector
                label={t("pets.add.energyLevel", "Energy Level")}
                options={["calm", "medium energy", "high energy"]}
                selectedOption={energyLevel}
                onSelect={setEnergyLevel}
                variant={chipVariant}
            />

            <View style={styles.toggleRow}>
                <AppText variant="body" color={colors.onSurface} style={{ flex: 1 }}>
                    {t("pets.edit.specialNeeds", "Does your pet have special needs?")}
                </AppText>
                <AppSwitch value={specialNeeds} onValueChange={setSpecialNeeds} />
            </View>

            {specialNeeds && setSpecialNeedsText && (
                <View style={styles.field}>
                    <Input
                        label={t("pets.add.specialNeeds", "Pet Special Needs")}
                        placeholder={t("pets.add.specialNeedsPlaceholder", "e.g., Needs insulin shots twice a day or is very shy around loud noises.")}
                        value={specialNeedsText}
                        onChangeText={setSpecialNeedsText}
                        inputStyle={styles.textArea}
                        multiline
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 0,
    },
    field: {
        marginTop: 8,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    helperText: {
        marginTop: -16,
        marginBottom: 8,
        textAlign: "right",
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        paddingVertical: 4,
    },
});
