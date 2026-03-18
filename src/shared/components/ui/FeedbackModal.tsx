import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";

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

  const height = useWindowDimensions().height;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      style={{ height, backgroundColor: colors.error }}
    >
      <Pressable style={{...styles.backdrop, height}} onPress={handleClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.surfaceContainer },
            containerStyle,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {icon && (
            <View style={styles.iconWrap}>
              {/* Ensure icon uses 24 size & primary fill when possible */}
              {icon}
            </View>
          )}
          <AppText variant="title" style={[styles.title, { fontSize: 16 }]}>
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
                variant="secondary"
                fullWidth
                onPress={onSecondary}
                style={styles.button}
              />
            )}
            <Button
              label={primaryLabel}
              variant={destructive ? "danger" : "primary"}
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    maxWidth: 360,
    width: "100%",
    marginHorizontal: 24,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    // Shadow so the card pops in both light & dark theme
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 4,
  },
  description: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 12,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    flex: 1,
  },
});
