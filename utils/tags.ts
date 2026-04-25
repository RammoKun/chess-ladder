const TAG_PATTERN = /^[a-zA-Z0-9 _-]{1,50}$/;

export function normalizeTagName(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

export function isValidTagName(input: string) {
  return TAG_PATTERN.test(normalizeTagName(input));
}

export function tagsEqualCaseInsensitive(a: string, b: string) {
  return normalizeTagName(a).toLowerCase() === normalizeTagName(b).toLowerCase();
}

export function dedupeTagsCaseInsensitive(tags: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawTag of tags) {
    const tag = normalizeTagName(rawTag);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(tag);
  }

  return normalized;
}

export function parseCommaSeparatedTags(input: string) {
  return dedupeTagsCaseInsensitive(input.split(",").map((item) => normalizeTagName(item)).filter(Boolean));
}
