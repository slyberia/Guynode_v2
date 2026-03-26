
import { Dataset, DataCategory } from '../types';

/**
 * Utility: Context Card Helpers
 * Generates quick stats, color codes, and previews for dataset cards.
 */

export const getCategoryColor = (category: DataCategory): string => {
  switch (category) {
    case 'Boundaries':
    case 'Administrative Boundaries': return 'bg-blue-500';
    case 'Demographics': return 'bg-purple-500';
    case 'Economy': return 'bg-guyana-gold';
    case 'Environment': return 'bg-guyana-green';
    case 'Infrastructure': return 'bg-gray-400';
    case 'Reference': return 'bg-gray-300';
    case 'Planning and Development': return 'bg-brand-green-600';
    default: return 'bg-gray-500';
  }
};

export const computeQuickStats = (dataset: Dataset): { label: string, value: string }[] => {
  // Mock logic. In real app, might read from a pre-computed metadata JSON.
  const stats = [
    { label: 'Size', value: dataset.size },
    { label: 'Format', value: dataset.format }
  ];

  if (dataset.format === 'GeoJSON') {
    stats.push({ label: 'Type', value: 'Vector' });
  } else if (dataset.format === 'CSV') {
    stats.push({ label: 'Type', value: 'Tabular' });
  }

  return stats;
};

export const getSmallPreview = (dataset: Dataset): string => {
  // Returns a CSS class or URL for a mini-preview
  // Using generic placeholder pattern for now
  return dataset.imageUrl || '/images/dataset-placeholder.jpg';
};
