/**
 * Shared dimensions and layout for search input and filter UI (Figma-aligned).
 * Use with Colors[resolvedTheme] for backgrounds, borders, and text.
 */
export const SearchFilterStyles = {
  /** Search bar height (pill shape) */
  searchBarHeight: 48,
  /** Search bar border radius (full pill = height/2) */
  searchBarBorderRadius: 24,
  /** Horizontal padding inside search bar (left when icon left) */
  searchBarPaddingHorizontal: 20,
  /** Right padding for search input (after icon) */
  searchBarPaddingRight: 12,
  /** Gap between icon and text in search bar */
  searchBarGap: 10,
  /** Search icon size */
  searchIconSize: 20,
  /** Search input font size */
  searchInputFontSize: 14,
  /** Filter button size (square, same as search height) */
  filterButtonSize: 48,
  /** Filter button border radius (full circle) */
  filterButtonBorderRadius: 24,
  /** Filter pill horizontal padding */
  filterPillPaddingHorizontal: 16,
  /** Filter pill vertical padding */
  filterPillPaddingVertical: 8,
  /** Filter pill border radius */
  filterPillBorderRadius: 999,
} as const;
