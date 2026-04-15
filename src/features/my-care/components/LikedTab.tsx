import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LikedPetCard } from './LikedPetCard';

interface LikedTabProps {
    colors: any;
    pets: any[];
    /** Open request detail when there is an open request; otherwise pet profile. */
    onApply: (requestId: string | null, petId: string) => void;
    onRemovePet: (petId: string) => void;
}

export function LikedTab({ colors, pets, onApply, onRemovePet }: LikedTabProps) {
    return (
        <View style={styles.likedList}>
            {pets.map((pet) => (
                <LikedPetCard
                    key={pet.petId}
                    colors={colors}
                    imageSource={pet.imageSource}
                    petName={pet.petName}
                    breed={pet.breed}
                    petType={pet.petType}
                    dateRange={pet.seekingDateRange}
                    time={pet.seekingTime}
                    description={pet.bio}
                    yardType={pet.yardType}
                    ageRange={pet.ageRange}
                    energyLevel={pet.energyLevel}
                    tags={pet.tags}
                    onApply={() => onApply(pet.requestId ?? null, pet.petId)}
                    onRemove={() => onRemovePet(pet.petId)}
                    isSeeking={pet.isSeeking}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    likedList: {
        gap: 12,
        paddingHorizontal: 16,
    },
});
