import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

type DetailPetGalleryChromeProps = {
  onBack: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Back control over a detail gallery (Figma-style: arrow on photo, safe-area aware).
 */
export function DetailPetGalleryChrome({
  onBack,
  children,
  style,
}: DetailPetGalleryChromeProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, style]}>
      {children}
      <View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, styles.overlay]}
      >
        <View
          style={[
            styles.topRow,
            { paddingTop: Math.max(insets.top, 8), paddingLeft: 8, paddingRight: 8 },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            hitSlop={12}
            style={styles.backDisc}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#FFFFFF" size={22} strokeWidth={2.25} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  overlay: {
    justifyContent: "flex-start",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
});
