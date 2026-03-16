export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Typography = {
  h1: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, lineHeight: FontSize['3xl'] * LineHeight.tight },
  h2: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, lineHeight: FontSize['2xl'] * LineHeight.tight },
  h3: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, lineHeight: FontSize.xl * LineHeight.tight },
  h4: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, lineHeight: FontSize.lg * LineHeight.normal },
  body: { fontSize: FontSize.base, fontWeight: FontWeight.regular, lineHeight: FontSize.base * LineHeight.normal },
  bodyMedium: { fontSize: FontSize.base, fontWeight: FontWeight.medium, lineHeight: FontSize.base * LineHeight.normal },
  caption: { fontSize: FontSize.sm, fontWeight: FontWeight.regular, lineHeight: FontSize.sm * LineHeight.normal },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, lineHeight: FontSize.xs * LineHeight.normal },
} as const;
