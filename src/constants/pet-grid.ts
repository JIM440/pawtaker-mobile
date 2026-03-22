/** Launch-request “Select pet” grid only: 3 columns per row. */
export const PET_GRID_COLUMNS = 3;
export const PET_GRID_GAP = 12;

/**
 * Horizontal inset from **each** screen edge (left and right). Pass `16` when
 * content uses 16px padding left and 16px right (inner width = `width - 32`).
 */
export const PAGE_HORIZONTAL_PADDING = 16;

/**
 * Column width for a 3-column grid inside horizontally padded content.
 * @param windowWidth — `useWindowDimensions().width`
 * @param horizontalPaddingPerEdge — padding from **one** side (e.g. `PAGE_HORIZONTAL_PADDING` = 16 → 32px total)
 */
export function getPetGridColumnWidth(
  windowWidth: number,
  horizontalPaddingPerEdge: number,
  gapPx: number = PET_GRID_GAP,
): number {
  const inner = windowWidth - horizontalPaddingPerEdge * 2;
  const totalGaps = gapPx * (PET_GRID_COLUMNS - 1);
  return (inner - totalGaps) / PET_GRID_COLUMNS;
}
