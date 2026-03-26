
import React from 'react';
import { ViewState } from '../types';

interface FooterProps {
  setView: (view: ViewState, params?: import("../utils/routing").RouteParams) => void;
}

export const Footer: React.FC<FooterProps> = ({ setView }) => {
  return (
    <footer className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-t border-gn-border dark:border-gn-border-dark py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
           <div>
             <h4 className="text-gn-foreground dark:text-gn-foreground-dark font-bold mb-6">Contact</h4>
             <ul className="space-y-4 text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
               <li>Georgetown Office +592 222 1234</li>
               <li>support@guynode.com</li>
               <li>
                 <button onClick={() => setView('REPORT_ISSUE')} className="hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors underline decoration-ink-300 dark:decoration-gray-700">
                   Report an Issue
                 </button>
               </li>
             </ul>
           </div>
           <div>
             <h4 className="text-gn-foreground dark:text-gn-foreground-dark font-bold mb-6">Services</h4>
             <ul className="space-y-4 text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
               <li><button onClick={() => setView('CATALOG')} className="hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors">Data Ingestion</button></li>
               <li><button onClick={() => setView('MAP')} className="hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors">Custom Mapping</button></li>
               <li><button onClick={() => setView('DOCS')} className="hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors">API Integration</button></li>
             </ul>
           </div>
           <div>
             <h4 className="text-gn-foreground dark:text-gn-foreground-dark font-bold mb-6">Legal</h4>
             <ul className="space-y-4 text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
               <li><button onClick={() => setView('SUPPORT', { supportSection: 'data-license' })} className="hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors">Data License</button></li>
               <li><button onClick={() => setView('PRIVACY')} className="hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors">Privacy Policy</button></li>
               <li><button onClick={() => setView('SUPPORT', { supportSection: 'terms-of-service' })} className="hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors">Terms of Service</button></li>
             </ul>
           </div>
           <div>
             <h4 className="text-gn-foreground dark:text-gn-foreground-dark font-bold mb-6">Subscribe</h4>
             <p className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-4">Get the latest dataset releases in your inbox.</p>
             <div className="flex">
                {/* Third-party form will be embedded here */}
             </div>
           </div>
        </div>
        <div className="pt-8 border-t border-gn-border dark:border-gn-border-dark flex flex-col items-center text-center">
          <p className="text-xs font-medium text-gn-foreground dark:text-gn-foreground-dark mb-4 bg-gn-border dark:bg-gn-border-dark px-4 py-2 rounded-full inline-block">
            Guynode is a static, zero-tracking spatial data archive. No accounts, no data harvesting, no AI runtime.
          </p>
          <div className="flex w-full justify-between items-center mt-4">
            <div className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
              © 2024 GuyNode Data Portal. All rights reserved.
            </div>
            <div className="text-xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark tracking-widest">
              GUYNODE
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
