
import { Dataset } from '../types';

export interface LegendItem {
  label: string;
  color: string;
  type: 'fill' | 'line' | 'point';
  dashed?: boolean;
}

export const getLegendEntriesForDataset = (dataset: Dataset, isComparison: boolean = false): LegendItem[] => {
  // In a real app, this would parse style metadata or SLD.
  // For Tier 3 Mock, we infer based on Category/ID.
  
  const baseColor = isComparison ? '#CE1126' : getColorForCategory(dataset.category);
  
  if (dataset.title.includes("Mining")) {
    return [{ label: 'Active Block', color: baseColor, type: 'fill' }];
  }
  
  if (dataset.title.includes("Boundaries") || dataset.title.includes("Regions")) {
    return [{ label: 'Administrative Boundary', color: baseColor, type: 'line' }];
  }

  if (dataset.title.includes("Population") || dataset.title.includes("Census")) {
     return [
       { label: 'High Density', color: baseColor, type: 'fill' },
       { label: 'Low Density', color: baseColor, type: 'fill', dashed: true }
     ];
  }

  return [{ label: dataset.title, color: baseColor, type: 'fill' }];
};

const getColorForCategory = (category: string): string => {
  switch (category) {
    case 'Boundaries': return '#3b82f6'; // Blue
    case 'Demographics': return '#a855f7'; // Purple
    case 'Economy': return '#FFC20E'; // Gold
    case 'Environment': return '#22c55e'; // Green
    default: return '#9ca3af';
  }
};
