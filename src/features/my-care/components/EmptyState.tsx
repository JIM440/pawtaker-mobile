import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface EmptyStateProps {
    colors: any;
    variant?: 'given' | 'received' | 'liked';
}

export function EmptyState({ colors, variant }: EmptyStateProps) {
    const title =
        variant === 'given'
            ? 'nothing to show yet'
            : variant === 'received'
              ? 'nothing to show yet'
              : 'nothing to show yet';

    const message =
        variant === 'given'
            ? 'start giving care to see your history here'
            : variant === 'received'
              ? 'start receiving care to see your history here'
              : 'When you like care requests, they will appear here.';

    const illustration =
        variant === 'liked'
            ? require('@/assets/illustrations/pets/no-pet.svg')
            : require('@/assets/illustrations/pets/no-care.svg');

    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyImgPlaceholder}>
                <AppImage
                    source={illustration}
                    type='svg'
                    contentFit="contain"
                    width={240}
                    height={200}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>
            <AppText
                variant="headline"
                style={{ fontSize: 16, lineHeight: 16, color: colors.onSurface, marginBottom: 4 }}
            >
                {title}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>
                {message}
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    emptyImgPlaceholder: {
        marginBottom: 40,
    },
});
