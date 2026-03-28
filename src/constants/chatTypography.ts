/**
 * Chat UI typography — aligned with Figma:
 * - Chat list: node 472-14422
 * - Thread / request card / composer: node 1489-18705
 * - Chat screen skeleton: node 1182-87157
 *
 * For **exact** font sizes, line heights, and spacing from Dev Mode, enable the
 * **Figma MCP** (or paste Inspect values here) so we can match pixels 1:1.
 *
 * Use with `<AppText variant="body" style={ChatTypography.rowName} />` so token
 * sizes override the default variant.
 */
export const ChatTypography = {
  /** Screen title e.g. "Chats" */
  listScreenTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontWeight: "600" as const,
  },
  /** Conversation row — contact name */
  rowName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  /** Last message preview */
  rowPreview: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  /** Right column time */
  rowTimestamp: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  /** Unread badge */
  rowBadge: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700" as const,
  },
  /** Thread header — name */
  threadHeaderName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  /** Thread header — subtitle */
  threadHeaderSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  /** Chat bubble body */
  bubbleBody: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  /** Under-bubble time */
  bubbleTime: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400" as const,
  },
  /** Date pill in thread */
  threadDatePill: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  /** Request card — section label */
  requestCardLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  /** Request card — pet name */
  requestPetName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as const,
  },
  /** Request card — breed / secondary */
  requestSecondary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  /** Request card — meta row */
  requestMeta: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  /** Composer input — avoid lineHeight here: Android TextInput clips visible text */
  composerInput: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: -0.2,
  },
} as const;
