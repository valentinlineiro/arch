const DETERMINISTIC_PREFIXES = ['[ANDON_HALT]', '[CORPUS_ALERT]', '[PATTERN-ALERT]', '[STALE_TASK]'];
const EXPIRABLE_PREFIXES = ['[ADVISORY]', '[SEMANTIC-DRIFT]', '[THINK]'];
const DATED_SECTION_RE = /^## (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) — /;
const AWAITING_REVIEW_RE = /^## \[AWAITING_REVIEW\] ([\w-]+)/;
const AWAITING_PROMOTION_RE = /^## \[AWAITING_PROMOTION\] ([\w-]+)/;
const PATTERN_ALERT_RE = /^\[PATTERN-ALERT\] (\[\w+\])/;

type Section = { header: string; lines: string[] };

function splitSections(inbox: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { header: '', lines: [] };
  for (const line of inbox.split('\n')) {
    if (line.startsWith('## ')) {
      sections.push(current);
      current = { header: line, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);
  return sections;
}

function isDeterministic(line: string): boolean {
  return DETERMINISTIC_PREFIXES.some(p => line.startsWith(p));
}

function isExpirable(line: string): boolean {
  return EXPIRABLE_PREFIXES.some(p => line.startsWith(p));
}

export function runInboxHygiene(
  inbox: string,
  archivedIds: Set<string>,
  now: Date,
  expiryDays: number,
): string {
  if (!inbox) return inbox;

  const sections = splitSections(inbox);

  // Pass 1: collect most-recent PATTERN-ALERT per category across all sections.
  // "Most recent" = earliest section index in document order (header/Alerts section first, then dated sections newest→oldest).
  // We want to keep the first occurrence and drop duplicates that follow.
  const seenPatternCategories = new Set<string>();

  // Pass 2: filter sections
  const filtered: Section[] = [];
  for (const section of sections) {
    const awaitingReviewMatch = AWAITING_REVIEW_RE.exec(section.header);
    const awaitingPromotionMatch = AWAITING_PROMOTION_RE.exec(section.header);

    if (awaitingReviewMatch && archivedIds.has(awaitingReviewMatch[1])) continue;
    if (awaitingPromotionMatch && archivedIds.has(awaitingPromotionMatch[1])) continue;

    const datedMatch = DATED_SECTION_RE.exec(section.header);
    if (datedMatch) {
      const sectionDate = new Date(datedMatch[1].replace(' ', 'T') + 'Z');
      const ageMs = now.getTime() - sectionDate.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays > expiryDays) {
        // Keep deterministic lines; drop expirable lines
        const keptLines = section.lines.filter(l => {
          const trimmed = l.trim();
          if (!trimmed) return true; // keep blank lines unless section becomes empty
          if (isDeterministic(trimmed)) return true;
          if (isExpirable(trimmed)) return false;
          return true; // keep unknown lines (headers, separators)
        });

        // If only blank lines / non-content remain, drop the section entirely
        const hasContent = keptLines.some(l => l.trim() && !l.startsWith('---'));
        if (!hasContent) continue;

        filtered.push({ header: section.header, lines: keptLines });
        continue;
      }
    }

    filtered.push({ header: section.header, lines: section.lines });
  }

  // Pass 3: deduplicate PATTERN-ALERT per category — keep first occurrence, remove later duplicates
  for (const section of filtered) {
    section.lines = section.lines.filter(line => {
      const m = PATTERN_ALERT_RE.exec(line.trim());
      if (!m) return true;
      const category = m[1];
      if (seenPatternCategories.has(category)) return false;
      seenPatternCategories.add(category);
      return true;
    });

    // Also check PATTERN-ALERT in section header (Alerts section lines were already collected above)
    // But headers themselves are never PATTERN-ALERT lines — nothing to do here.
  }

  // Also dedup PATTERN-ALERT in the header sections (they appear as lines, not headers)
  // (already handled above since header sections' lines go through the same filter)

  // Reassemble
  const parts: string[] = [];
  for (const section of filtered) {
    if (section.header === '') {
      parts.push(section.lines.join('\n'));
    } else {
      parts.push(section.header + '\n' + section.lines.join('\n'));
    }
  }
  return parts.join('\n');
}
