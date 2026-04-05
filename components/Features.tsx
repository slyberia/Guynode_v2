
import React from 'react';
import { ViewState } from '../types';

interface FeaturesProps {
  setView: (view: ViewState) => void;
}

const FeatureCard = ({ title, description, action, onClick }: { title: string, description: string, action: string, onClick: () => void }) => (
  <div className="group bg-cream-200 dark:bg-gn-elevated-dark hover:bg-cream-300 dark:hover:bg-white/5 border border-cream-300 dark:border-white/5 rounded-lg p-8 transition-all cursor-pointer flex flex-col justify-between min-h-[300px]" onClick={onClick}>
    <div>
      <h3 className="text-xl font-bold text-ink-900 dark:text-white mb-4 group-hover:text-brand-green-600 dark:group-hover:text-gn-accent-gold transition-colors">{title}</h3>
      <p className="text-ink-700 dark:text-gray-400 text-sm leading-relaxed mb-6">{description}</p>
    </div>
    <div className="flex items-center text-sm font-semibold text-brand-green-600 dark:text-white group-hover:translate-x-2 transition-transform duration-300">
      {action} <span className="ml-2">→</span>
    </div>
  </div>
);

export const Features: React.FC<FeaturesProps> = ({ setView }) => {
  return (
    <section className="py-24 bg-cream-100 dark:bg-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 dark:text-white mb-6">
            A single, trusted entry point for Guyana’s spatial data.
          </h2>
          <p className="text-ink-700 dark:text-gray-400 text-lg">
            Guynode brings together administrative, environmental, and infrastructure data in one place, with clear documentation and transparent sourcing, so anyone can quickly find, explore, and put national data to work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            title="Structured Data Catalog"
            description="Access foundational datasets including boundaries, demographics, and natural resources. Standardized and verified."
            action="Browse Catalog"
            onClick={() => setView('CATALOG')}
          />
          <FeatureCard 
            title="Interactive GIS Viewer"
            description="Visualize spatial data with our advanced mapping engine. Layer multiple datasets for deep geospatial insights."
            action="Open Map"
            onClick={() => setView('MAP')}
          />
          <FeatureCard 
            title="Developer Resources"
            description="Integrate GuyNode directly into your applications with our robust API suite and technical documentation."
            action="View Docs"
            onClick={() => setView('DOCS')}
          />
        </div>
      </div>
    </section>
  );
};
