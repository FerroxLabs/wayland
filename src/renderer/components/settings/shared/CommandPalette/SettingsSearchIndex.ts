import ENTRIES, { type SearchEntry } from './searchEntries';

/**
 * Substring + title-weighted search over the settings registry.
 * Title matches score higher than subtitle matches.
 */
export class SettingsSearchIndex {
  private entries: SearchEntry[];

  constructor(extraEntries: SearchEntry[] = []) {
    this.entries = [...ENTRIES, ...extraEntries];
  }

  search(query: string): SearchEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.entries.slice(0, 8);

    type Scored = { entry: SearchEntry; score: number };
    const scored: Scored[] = [];

    for (const entry of this.entries) {
      const titleLower = entry.title.toLowerCase();
      const subtitleLower = (entry.subtitle ?? '').toLowerCase();

      if (titleLower.includes(q)) {
        // Title match - higher weight; exact prefix scores even higher
        const score = titleLower.startsWith(q) ? 10 : 5;
        scored.push({ entry, score });
      } else if (subtitleLower.includes(q)) {
        scored.push({ entry, score: 1 });
      }
    }

    return scored
      .toSorted((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => s.entry);
  }
}
