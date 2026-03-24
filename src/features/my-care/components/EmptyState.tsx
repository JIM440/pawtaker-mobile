import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface EmptyStateProps {
    colors: any;
    variant?: 'given' | 'received' | 'liked';
}

export function EmptyState({ colors, variant }: EmptyStateProps) {
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyImgPlaceholder}>
                <AppImage
                    source={require('@/assets/illustrations/pets/no-care.svg')}
                    type='svg'
                    contentFit="contain"
                    width={240}
                    height={200}
                    style={{ backgroundColor: 'transparent' }}
                />
            </View>
            <AppText variant="headline" style={{ fontSize: 16, lineHeight: 16, color: colors.onSurface, marginBottom: 4 }}>
                Nothing to show yet
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>
                Start giving care to see your history here
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
