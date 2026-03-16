import { View, Text, TouchableOpacity } from 'react-native';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-20">
      <Text className="text-4xl mb-4">🐾</Text>
      <Text className="text-lg font-semibold text-text-primary mb-2 text-center">{title}</Text>
      {subtitle && <Text className="text-text-secondary text-center mb-6">{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-xl"
          onPress={onAction}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
