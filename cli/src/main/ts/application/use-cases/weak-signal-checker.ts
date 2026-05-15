const ISO_DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;
const PROMOTED_DEMOTED_RE = /—\s*(PROMOTED|DEMOTED)\s+\d{4}-\d{2}-\d{2}/i;

export function parseAdjudicationDate(line: string): string | null {
  if (PROMOTED_DEMOTED_RE.test(line)) return null;
  const match = line.match(ISO_DATE_RE);
  return match ? match[1] : null;
}

export function hasOverdueWeakSignal(content: string, today: Date, warnings: string[]): boolean {
  const adjLines = content
    .split('\n')
    .filter(l => l.includes('**Adjudicate by:**'));

  const activeDates = adjLines
    .map(l => parseAdjudicationDate(l))
    .filter((d): d is string => d !== null);

  if (activeDates.length === 0 && adjLines.length > 0) {
    warnings.push(`[WEAK-SIGNAL] no ISO date found in ${adjLines.length} Adjudicate by entries — skipping immediate trigger (fail-closed)`);
    return false;
  }

  const todayStr = today.toISOString().slice(0, 10);
  return activeDates.some(d => d <= todayStr);
}
