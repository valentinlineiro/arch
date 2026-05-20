import type { CorpusEntry } from '../../application/use-cases/corpus-index.js';

export interface RecurringCategory {
  category: string;
  count: number;
  taskIds: string[];
}

export interface ClassConcentration {
  dominantClass: string;
  fraction: number;
}

export interface AnomalyReport {
  recurringCategories: RecurringCategory[];
  classConcentration: ClassConcentration | null;
}

const CLASS_CONCENTRATION_THRESHOLD = 0.6;

export class InstitutionalAnomalyTracker {
  static analyze(corpus: Record<string, CorpusEntry>, minCount: number): AnomalyReport {
    const entries = Object.values(corpus);
    if (entries.length === 0) {
      return { recurringCategories: [], classConcentration: null };
    }

    const categoryMap = new Map<string, string[]>();
    for (const e of entries) {
      if (!e.category) continue;
      const existing = categoryMap.get(e.category) ?? [];
      existing.push(e.id);
      categoryMap.set(e.category, existing);
    }

    const recurringCategories: RecurringCategory[] = [];
    for (const [category, taskIds] of categoryMap.entries()) {
      if (taskIds.length >= minCount) {
        recurringCategories.push({ category, count: taskIds.length, taskIds });
      }
    }
    recurringCategories.sort((a, b) => b.count - a.count);

    const classMap = new Map<string, number>();
    for (const e of entries) {
      classMap.set(e.class, (classMap.get(e.class) ?? 0) + 1);
    }
    let classConcentration: ClassConcentration | null = null;
    for (const [cls, count] of classMap.entries()) {
      const fraction = count / entries.length;
      if (fraction >= CLASS_CONCENTRATION_THRESHOLD) {
        classConcentration = { dominantClass: cls, fraction };
        break;
      }
    }

    return { recurringCategories, classConcentration };
  }
}
