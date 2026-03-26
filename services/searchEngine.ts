
import { Dataset, SearchResult } from '../types';

/**
 * Section 8: Search Index Model
 * 
 * Provides client-side full-text search capabilities with relevance scoring.
 */

export class SearchEngine {
  
  /**
   * Calculates a relevance score for a dataset based on a query.
   * Scoring Logic:
   * - Title match: 10 points
   * - ID match: 20 points
   * - Category match: 5 points
   * - Description match: 2 points
   * - Source match: 3 points
   */
  private static calculateScore(dataset: Dataset, terms: string[]): number {
    let score = 0;
    const lowerTitle = dataset.title.toLowerCase();
    const lowerDesc = dataset.description.toLowerCase();
    const lowerSource = dataset.source.toLowerCase();
    const lowerCat = dataset.category.toLowerCase();

    terms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      
      if (dataset.id.toLowerCase() === lowerTerm) score += 20;
      if (lowerTitle.includes(lowerTerm)) score += 10;
      if (lowerCat.includes(lowerTerm)) score += 5;
      if (lowerSource.includes(lowerTerm)) score += 3;
      if (lowerDesc.includes(lowerTerm)) score += 2;
    });

    return score;
  }

  /**
   * Executes a search against the provided dataset catalog.
   */
  static search(datasets: Dataset[], query: string): SearchResult[] {
    if (!query.trim()) {
      return datasets.map(d => ({ item: d, score: 1, matches: [] }));
    }

    const terms = query.trim().split(/\s+/);
    
    const results = datasets.map(dataset => {
      const score = this.calculateScore(dataset, terms);
      return {
        item: dataset,
        score,
        matches: terms.filter(t => 
          dataset.title.toLowerCase().includes(t.toLowerCase()) || 
          dataset.description.toLowerCase().includes(t.toLowerCase())
        )
      };
    });

    // Filter out zero relevance and sort by score descending
    return results
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}
