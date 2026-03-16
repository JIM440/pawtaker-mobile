import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from './AppText';
import { Button } from './Button';

type FeedbackModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** When true, primary button uses danger styling */
  destructive?: boolean;
  onRequestClose?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Reusable confirmation / feedback modal with icon, text, and primary/secondary buttons.
 * Intended to be wrapped in screens; shows an overlay and centered card.
 */
export function FeedbackModal({
  visible,
  title,
  description,
  icon,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  destructive = false,
  onRequestClose,
  containerStyle,
}: FeedbackModalProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const handleClose = () => {
    if (onRequestClose) onRequestClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.surfaceContainerLowest },
            containerStyle,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <AppText variant="title" style={styles.title}>
            {title}
          </AppText>
          {description ? (
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.description}
            >
              {description}
            </AppText>
          ) : null}
          <View style={styles.buttons}>
            {secondaryLabel && onSecondary && (
              <Button
                label={secondaryLabel}
                variant="outline"
                fullWidth
                onPress={onSecondary}
                style={styles.button}
              />
            )}
            <Button
              label={primaryLabel}
              variant={destructive ? 'danger' : 'primary'}
              fullWidth
              onPress={onPrimary}
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    maxWidth: 360,
    width: '100%',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
});

