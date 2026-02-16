function getBigrams(text: string): Set<string> {
  const normalized = text.replace(/\s+/g, "").toLowerCase();
  const bigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.add(normalized.slice(i, i + 2));
  }
  return bigrams;
}

export function jaccardSimilarity(a: string, b: string): number {
  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);
  if (bigramsA.size === 0 && bigramsB.size === 0) return 0;

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  const union = bigramsA.size + bigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function maxSimilarity(text: string, benchmarks: string[]): number {
  if (benchmarks.length === 0) return 0;
  return Math.max(...benchmarks.map((b) => jaccardSimilarity(text, b)));
}
