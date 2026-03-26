/**
 * Utility: Semantic Versioning and Recency Helpers
 * Task 4.A
 */

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

export const parseSemver = (version: string): SemVer | null => {
  try {
    const regex = /^v?(\d+)\.(\d+)\.(\d+)$/;
    const match = version.match(regex);
    if (!match) return null;
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
    };
  } catch {
    return null;
  }
};

export const isRecentlyUpdated = (updatedAt: string, days: number = 14): boolean => {
  try {
    const updated = new Date(updatedAt).getTime();
    const now = Date.now();
    const diffTime = Math.abs(now - updated);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  } catch {
    return false;
  }
};