import React from 'react';
import type {
  KeyboardTypeOptions,
  TextInputProps,
} from 'react-native';
import { Input } from '@/src/shared/components/ui/Input';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({
  label,
  error,
  ...props
}: Props) {
  return (
    <Input
      label={label}
      error={error}
      {...props}
    />
  );
}

