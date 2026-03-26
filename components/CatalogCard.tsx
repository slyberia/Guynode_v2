
import React from 'react';
import { Dataset, ValidationStatus } from '../types';
import { getCategoryColor, computeQuickStats, } from '../utils/contextCardUtils';

interface CatalogCardProps {
  dataset: Dataset;
  isSelected: boolean;
  onClick: () => void;
}

const ValidationBadge: React.FC<{ status: ValidationStatus }> = ({ status }) => {
  const colors = {
    [ValidationStatus.VERIFIED]: 'text-green-600 bg-green-600/10 border-green-600/30 dark:text-green-400 dark:bg-green-400/10 dark:border-green-400/30',
    [ValidationStatus.WARNING]: 'text-yellow-600 bg-yellow-600/10 border-yellow-600/30 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/30',
    [ValidationStatus.ERROR]: 'text-red-600 bg-red-600/10 border-red-600/30 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/30',
    [ValidationStatus.UNCHECKED]: 'text-gray-500 bg-gray-200 border-gray-300 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-600',
  };

  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${colors[status]} uppercase tracking-wider`}>
      {status}
    </span>
  );
};

export const CatalogCard: React.FC<CatalogCardProps> = ({ dataset, isSelected, onClick }) => {
  const stats = computeQuickStats(dataset);
  const categoryColor = getCategoryColor(dataset.category);

  return (
    <div 
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      role="button"
      tabIndex={0}
      className={`relative p-4 cursor-pointer hover:bg-stone-200 dark:hover:bg-white/5 transition-colors group border-l-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500 ${isSelected ? 'bg-stone-200 border-yellow-500 dark:bg-white/10 dark:border-yellow-400' : 'border-transparent'}`}
    >
      {/* Category Stripe */}
      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${categoryColor}`}></div>

      <div className="flex justify-between items-start mb-2 pr-4">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-500">{dataset.id.toUpperCase()}</span>
        <ValidationBadge status={dataset.validationReport?.status || ValidationStatus.UNCHECKED} />
      </div>

      <div className="flex gap-4">
        {/* Mini Preview */}
        <div className="w-16 h-16 flex-shrink-0 bg-white dark:bg-black border border-stone-300 dark:border-white/10 rounded overflow-hidden hidden sm:block">
           <img
              src={dataset.imageUrl ? dataset.imageUrl : '/images/dataset-placeholder.jpg'}
              onError={(e) => {
                e.currentTarget.src = '/images/dataset-placeholder.jpg';
              }}
              alt=""
              className="w-full h-full object-cover opacity-80 dark:opacity-60"
           />
        </div>

        <div className="flex-1">
          <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
            {dataset.title}
          </h3>
          
          {/* Provenance Cues */}
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 flex flex-col gap-0.5">
             <div className="flex items-center gap-1">
                <span className="font-bold">Source:</span> {dataset.source}
             </div>
             <div className="flex items-center gap-1">
                <span className="font-bold">Updated:</span> {new Date(dataset.lastUpdated).toLocaleDateString()}
             </div>
             {dataset.fileSize && (
               <div className="flex items-center gap-1">
                  <span className="font-bold">Size:</span> {dataset.fileSize}
               </div>
             )}
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2">
             {stats.map((s, i) => (
               <span key={i}><strong>{s.label}:</strong> {s.value}</span>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
