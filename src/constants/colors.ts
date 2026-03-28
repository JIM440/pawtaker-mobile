/**
 * App colors – Complete Material 3 Light & Dark schemes
 * Updated with your specific requests + full theme tokens
 */
const materialLight = {
  primary: "#8C4A60",
  onPrimary: "#E1E2C7",
  primaryContainer: "#FFD9E2",
  onPrimaryContainer: "#703348",

  secondary: "#74565F",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFE0E8",
  onSecondaryContainer: "#5A3F47",

  tertiary: "#7C5635",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFDCC1",
  onTertiaryContainer: "#623F20",

  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",

  background: "#F5F0F0",
  onBackground: "#22191C",
  surface: "#FFF8F8", // ← your requested value
  onSurface: "#22191C",
  surfaceVariant: "#F2DDE1",
  onSurfaceVariant: "#665459",

  surfaceDim: "#EBDDDF",
  surfaceBright: "#FFFAFA",

  surfaceContainer: "#FAF2F4",
  surfaceContainerLow: "#FFF7F8",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerHigh: "#F5EEEF",
  surfaceContainerHighest: "#EDE6E7",

  outline: "#837377",
  outlineVariant: "#D5C2C6",

  // Additional useful tokens
  inverseSurface: "#372E30",
  inverseOnSurface: "#FDEDEF",
  inversePrimary: "#FFB1C8",

  primaryFixed: "#FFD9E2",
  onPrimaryFixed: "#3A071D",
  primaryFixedDim: "#FFB1C8",
  onPrimaryFixedVariant: "#703348",

  secondaryFixed: "#FFD9E2",
  onSecondaryFixed: "#2B151C",
  secondaryFixedDim: "#E38DC6",
  onSecondaryFixedVariant: "#5A3F47",

  tertiaryFixed: "#FFDCC1",
  onTertiaryFixed: "#2E1500",
  tertiaryFixedDim: "#EFBD94",
  onTertiaryFixedVariant: "#623F20",
} as const;

const materialDark = {
  primary: "#995169",
  onPrimary: "#E1E2C7", // ← your requested value
  primaryContainer: "#703348",
  onPrimaryContainer: "#FFD9E2",

  secondary: "#E38DC6",
  onSecondary: "#422931",
  secondaryContainer: "#5A3F47",
  onSecondaryContainer: "#FFD9E2",

  tertiary: "#EFBD94",
  onTertiary: "#48290B",
  tertiaryContainer: "#623F20",
  onTertiaryContainer: "#FFDCC1",

  error: "#FF6D6D", // ← your requested value
  onError: "#690005",
  errorContainer: "#462B29",
  onErrorContainer: "#93000A",

  background: "#171516",
  onBackground: "#EFDFE1",
  surface: "#191113",
  onSurface: "#EFDFE1",
  surfaceVariant: "#514347",
  onSurfaceVariant: "#D5C2C6",

  surfaceDim: "#191113",
  surfaceBright: "#242121",

  surfaceContainer: "#1C1A1A",
  surfaceContainerLow: "#121011",
  surfaceContainerLowest: "#1A1718",
  surfaceContainerHigh: "#292425", // ← your requested value
  surfaceContainerHighest: "#2E2B2C",

  outline: "#9E8C90",
  outlineVariant: "#514347",

  // Additional useful tokens
  inverseSurface: "#EFDFE1",
  inverseOnSurface: "#372E30",
  inversePrimary: "#8C4A60",

  primaryFixed: "#FFD9E2",
  onPrimaryFixed: "#3A071D",
  primaryFixedDim: "#FFB1C8",
  onPrimaryFixedVariant: "#703348",

  secondaryFixed: "#FFD9E2",
  onSecondaryFixed: "#2B151C",
  secondaryFixedDim: "#E38DC6",
  onSecondaryFixedVariant: "#5A3F47",

  tertiaryFixed: "#FFDCC1",
  onTertiaryFixed: "#2E1500",
  tertiaryFixedDim: "#EFBD94",
  onTertiaryFixedVariant: "#623F20",
} as const;

export const Colors = {
  light: {
    ...materialLight,
    frameStroke: "#E8E7E7",
    textPrimary: materialLight.onSurface,
    textSecondary: materialLight.onSurfaceVariant,
    border: materialLight.outlineVariant,
    accent: materialLight.tertiary,
    accentLight: materialLight.tertiaryContainer,
    primaryLight: materialLight.primaryContainer,
  },
  dark: {
    ...materialDark,
    frameStroke: "#403A37",
    textPrimary: materialDark.onSurface,
    textSecondary: materialDark.onSurfaceVariant,
    border: materialDark.outlineVariant,
    accent: materialDark.tertiary,
    accentLight: materialDark.tertiaryContainer,
    primaryLight: materialDark.primaryContainer,
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ColorToken = keyof typeof Colors.light;
export type ColorValues = (typeof Colors)[ColorScheme];
