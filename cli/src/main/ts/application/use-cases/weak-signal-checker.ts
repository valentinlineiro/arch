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
    .filter(l => l.includes('**Adjudicate by:**'))
    .filter(l => !l.trim().startsWith('<!--'))       // skip template placeholder comments
    .filter(l => !PROMOTED_DEMOTED_RE.test(l));       // skip resolved lines silently

  const activeDates: string[] = [];
  for (const line of adjLines) {
    const date = parseAdjudicationDate(line);
    if (date !== null) {
      activeDates.push(date);
    } else {
      warnings.push(`[WEAK-SIGNAL] Adjudicate by line has no ISO date — skipping (fail-closed): "${line.trim()}"`);
    }
  }

  const todayStr = today.toISOString().slice(0, 10);
  return activeDates.some(d => d <= todayStr);
}
