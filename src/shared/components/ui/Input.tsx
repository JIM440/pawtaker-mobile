import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-medium text-text-primary mb-1">{label}</Text>}
      <TextInput
        className={[
          'bg-surface border rounded-xl px-4 py-3 text-text-primary text-base',
          error ? 'border-danger' : 'border-border',
        ].join(' ')}
        placeholderTextColor="#6B7280"
        {...props}
      />
      {error && <Text className="text-danger text-xs mt-1">{error}</Text>}
    </View>
  );
}
