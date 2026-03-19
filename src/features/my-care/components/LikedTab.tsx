import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LikedPetCard } from './LikedPetCard';

interface LikedTabProps {
    colors: any;
    pets: any[];
    onApply: () => void;
}

export function LikedTab({ colors, pets, onApply }: LikedTabProps) {
    const handleRemove = (petId: string) => {
        console.log('Remove from liked:', petId);
        // In a real app, this would trigger a mutation
    };

    return (
        <View style={styles.likedList}>
            {pets.map((pet) => (
                <LikedPetCard
                    key={pet.id}
                    colors={colors}
                    imageSource={pet.imageSource}
                    petName={pet.petName}
                    breed={pet.breed}
                    petType={pet.petType}
                    dateRange={pet.seekingDateRange}
                    time={pet.seekingTime}
                    description={pet.bio}
                    tags={pet.tags}
                    onApply={onApply}
                    onRemove={() => handleRemove(pet.id)}
                    isSeeking={pet.isSeeking}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    likedList: {
        gap: 12,
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
});
