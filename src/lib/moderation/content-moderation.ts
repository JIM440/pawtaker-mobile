const SEXUAL_TEXT_PATTERNS: RegExp[] = [
  /\bnude\b/i,
  /\bnudes\b/i,
  /\bnudity\b/i,
  /\bnaked\b/i,
  /\bsexual\b/i,
  /\bporn\b/i,
  /\bxxx\b/i,
  /\bnsfw\b/i,
  /\bfuck\b/i,
  /\bfucking\b/i,
  /\bfucked\b/i,
  /\bbitch\b/i,
  /\bbitches\b/i,
  /\bnigga\b/i,
  /\bnigger\b/i,
];

const SEXUAL_IMAGE_HINT_PATTERNS: RegExp[] = [
  /nude/i,
  /nudity/i,
  /naked/i,
  /porn/i,
  /xxx/i,
  /nsfw/i,
  /adult/i,
];

export function hasSexualTextContent(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return SEXUAL_TEXT_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function hasSexualImageHint(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return SEXUAL_IMAGE_HINT_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function shouldBlockTextSubmission(value: string): boolean {
  return hasSexualTextContent(value);
}

export function shouldBlockImageLikeSubmission(params: {
  fileName?: string | null;
  uri?: string | null;
  caption?: string | null;
}): boolean {
  const { fileName, uri, caption } = params;
  return (
    hasSexualImageHint(fileName ?? "") ||
    hasSexualImageHint(uri ?? "") ||
    hasSexualTextContent(caption ?? "")
  );
}
