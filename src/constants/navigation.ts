import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

/**
 * Inactive tab screens stay unmounted until first visit (`lazy`) and freeze when blurred
 * (`freezeOnBlur` — requires `enableFreeze(true)` from `react-native-screens` in `app/_layout.tsx`).
 */
export const tabPerfScreenOptions: Pick<
  BottomTabNavigationOptions,
  "lazy" | "freezeOnBlur"
> = {
  lazy: true,
  freezeOnBlur: true,
};

/** Nested stack: previous routes freeze instead of re-rendering on every transition. */
export const stackPerfScreenOptions: Pick<
  NativeStackNavigationOptions,
  "freezeOnBlur"
> = {
  freezeOnBlur: true,
};
