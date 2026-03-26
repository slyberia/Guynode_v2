
import React, { useEffect } from 'react';
import { ViewState } from '../types';

interface SupportPageProps {
  navigate: (view: ViewState, params?: import("../utils/routing").RouteParams) => void;
  section?: string;
}

export const SupportPage: React.FC<SupportPageProps> = ({ navigate, section }) => {
  
  useEffect(() => {
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        // Add a slight delay to ensure render is stable
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [section]);

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Header */}
        <div className="border-b border-gn-border dark:border-gn-border-dark pb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Support & Legal</h1>
          <p className="text-xl text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed">
            Resources for using GuyNode data responsibly, understanding your rights, and reporting platform issues.
          </p>
        </div>

        {/* 1. Data License */}
        <section id="data-license" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4 flex items-center gap-3">
            <span className="w-8 h-1 bg-guyana-gold rounded-full"></span>
            Data License & Usage
          </h2>
          <div className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-8 space-y-4 text-gn-foreground-muted dark:text-gray-300 leading-relaxed">
            <p>
              GuyNode operates as an Open Geospatial Data Hub. Unless otherwise noted in specific dataset metadata, all data is provided under the <strong>Creative Commons Attribution 4.0 International (CC BY 4.0)</strong> license or is in the <strong>Public Domain</strong>.
            </p>
            <div className="bg-gn-surface dark:bg-white/5 p-4 rounded border-l-2 border-guyana-gold">
              <h4 className="text-gn-foreground dark:text-white font-bold text-sm mb-2">You are free to:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Share:</strong> Copy and redistribute the material in any medium or format.</li>
                <li><strong>Adapt:</strong> Remix, transform, and build upon the material for any purpose, even commercially.</li>
              </ul>
              <h4 className="text-gn-foreground dark:text-white font-bold text-sm mt-4 mb-2">Under the following terms:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Attribution:</strong> You must give appropriate credit to "GuyNode" and the original Source Authority (e.g., "Source: GuyNode / Guyana Lands & Surveys Commission"), provide a link to the license, and indicate if changes were made.</li>
              </ul>
            </div>
            <p className="text-sm italic text-gn-foreground-muted dark:text-gray-500">
              Note: This platform aggregates data from various agencies. While we standardize formats, the original copyright may reside with the producing agency (e.g., GLSC, Bureau of Statistics). Always check the specific metadata panel for each layer.
            </p>
          </div>
        </section>

        {/* 2. Privacy Policy */}
        <section id="privacy-policy" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4 flex items-center gap-3">
            <span className="w-8 h-1 bg-bloom-accent rounded-full"></span>
            Privacy Policy
          </h2>
          <div className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-8 space-y-4 text-gn-foreground-muted dark:text-gray-300 leading-relaxed">
            <p>
              GuyNode is built with a "Privacy First" architecture. We do not track individual user behavior for advertising purposes.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-bloom-accent font-bold min-w-[80px]">No Tracking:</span>
                <span>We do not use third-party advertising cookies or cross-site trackers.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-bloom-accent font-bold min-w-[80px]">Local Data:</span>
                <span>Preferences (such as Theme selection or Admin session tokens) are stored in your browser's `localStorage` and never transmitted to our servers except to maintain session state.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-bloom-accent font-bold min-w-[80px]">AI Processing:</span>
                <span>When using the AI Assistant, your query is sent to Google Gemini APIs for processing. No personal identifiers are attached to these requests by GuyNode.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-bloom-accent font-bold min-w-[80px]">Forms:</span>
                <span>Data submitted via the "Report an Issue" or "Request a Demo" forms is used solely for correspondence. <strong>Do not submit sensitive personal information (financial data, government IDs) through these channels.</strong></span>
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Terms of Service */}
        <section id="terms-of-service" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4 flex items-center gap-3">
            <span className="w-8 h-1 bg-guyana-green rounded-full"></span>
            Terms of Service
          </h2>
          <div className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-8 space-y-4 text-gn-foreground-muted dark:text-gray-300 leading-relaxed">
            <h4 className="text-gn-foreground dark:text-white font-bold">1. Disclaimer of Warranty</h4>
            <p>
              The data is provided "as is" without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            
            <h4 className="text-gn-foreground dark:text-white font-bold mt-4">2. Limitation of Liability</h4>
            <p>
              In no event shall the authors, contributors, or GuyNode maintainers be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the data.
            </p>

            <div className="mt-6 text-sm bg-red-900/20 text-red-800 dark:text-red-200 border border-red-500/30 p-4 rounded flex gap-4 items-start">
              <span className="text-xl">⚠️</span>
              <div>
                <strong>Critical Notice regarding Navigation & Land Disputes:</strong><br/>
                GuyNode data is for informational and planning purposes only. It should <strong>NOT</strong> be used as the sole basis for:
                <ul className="list-disc pl-5 mt-2 space-y-1 opacity-90">
                  <li>Legal land boundary disputes.</li>
                  <li>Real-time navigation (air, sea, or land).</li>
                  <li>Critical safety infrastructure engineering without ground-truthing.</li>
                </ul>
                <div className="mt-2">Always consult official certified survey plans from the Guyana Lands and Surveys Commission (GLSC) for legal determinations.</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Report Issue */}
        <section id="report-issue" className="scroll-mt-24 pt-8 border-t border-gn-border dark:border-gn-border-dark">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-gn-surface-muted dark:bg-white/5 border border-gn-border dark:border-gn-border-dark rounded-xl p-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark">Contact & Support</h2>
              <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark max-w-lg">
                Found a broken link, missing file, or map error? Let us know so we can fix it for the community.
              </p>
            </div>
            <button 
              onClick={() => navigate('REPORT_ISSUE')}
              className="whitespace-nowrap bg-bloom-accent hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-blue-900/20 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Open Issue Report Form
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
