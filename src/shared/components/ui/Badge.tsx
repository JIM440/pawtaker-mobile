import { View, Text } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  success: { container: 'bg-success/10', text: 'text-success' },
  warning: { container: 'bg-warning/10', text: 'text-warning' },
  danger: { container: 'bg-danger/10', text: 'text-danger' },
  info: { container: 'bg-primary-light/10', text: 'text-primary-light' },
  neutral: { container: 'bg-border', text: 'text-text-secondary' },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <View className={`px-2 py-0.5 rounded-full self-start ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{label}</Text>
    </View>
  );
}
