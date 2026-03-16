import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-surface rounded-2xl shadow-sm border border-border p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
