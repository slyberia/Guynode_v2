
import React, { useState } from 'react';
import { ViewState } from '../types';

interface ReportIssuePageProps {
  navigate: (view: ViewState, params?: import("../utils/routing").RouteParams) => void;
}

export const ReportIssuePage: React.FC<ReportIssuePageProps> = ({ navigate }) => {
  const [formData, setFormData] = useState({
    issueType: 'BROKEN_LINK',
    url: '',
    description: '',
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would POST to a backend or serverless function.
    // For this client-side architecture, we mock the success and suggest email fallback.
    console.log("Issue Reported:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark">Report Logged</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
            Thank you for helping improve GuyNode. We have logged your issue locally.
          </p>
          <div className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark p-4 rounded text-sm text-gn-foreground dark:text-gray-300">
            <p className="mb-2">For urgent matters, please also email us directly:</p>
            <a href="mailto:support@guynode.com" className="text-gn-accent-blue font-bold hover:underline">support@guynode.com</a>
          </div>
          <button 
            onClick={() => navigate('SUPPORT')}
            className="text-gn-foreground hover:text-gn-accent-blue dark:text-white dark:hover:text-gn-accent-blue font-bold underline mt-4 block focus:outline-none focus:ring-2 focus:ring-gn-accent-blue rounded p-1"
          >
            Return to Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 pb-20 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        
        <button 
          onClick={() => navigate('SUPPORT')}
          className="text-xs font-mono text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark mb-8 flex items-center gap-2 focus:outline-none focus:underline"
        >
          ← BACK TO SUPPORT
        </button>

        <h1 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-2">Report an Issue</h1>
        <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-8">
          Use this form to report technical issues, broken links, or data inaccuracies. 
          <br/>
          <span className="text-xs italic opacity-80">Note: We do not handle land disputes or legal grievances. Please contact the relevant authorities for such matters.</span>
        </p>

        <form onSubmit={handleSubmit} className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-8 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gn-foreground-muted dark:text-gn-foreground-muted-dark uppercase mb-2">Issue Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'BROKEN_LINK', label: 'Broken Link' },
                { id: 'MAP_ERROR', label: 'Map Error' },
                { id: 'MISSING_DATA', label: 'Missing Data' },
                { id: 'OTHER', label: 'Other' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({...formData, issueType: type.id})}
                  className={`text-xs font-bold py-3 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-gn-accent-blue ${
                    formData.issueType === type.id 
                      ? 'bg-gn-accent-blue text-white border-gn-accent-blue' 
                      : 'bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground-muted dark:text-gn-foreground-muted-dark border-gn-border dark:border-gn-border-dark hover:border-gn-foreground-muted dark:hover:border-gn-foreground-muted-dark'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="issue-url" className="block text-xs font-bold text-gn-foreground-muted dark:text-gn-foreground-muted-dark uppercase mb-2">Relevant URL (Optional)</label>
            <input 
              id="issue-url"
              type="text"
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
              placeholder="e.g. https://guynode.com/?view=MAP..."
              className="w-full bg-gn-surface dark:bg-gn-surface-dark border border-gn-border dark:border-gn-border-dark rounded p-3 text-sm text-gn-foreground dark:text-gn-foreground-dark focus:border-gn-accent-blue outline-none"
            />
          </div>

          <div>
            <label htmlFor="issue-desc" className="block text-xs font-bold text-gn-foreground-muted dark:text-gn-foreground-muted-dark uppercase mb-2">Description</label>
            <textarea 
              id="issue-desc"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what happened or what you expected..."
              required
              className="w-full h-32 bg-gn-surface dark:bg-gn-surface-dark border border-gn-border dark:border-gn-border-dark rounded p-3 text-sm text-gn-foreground dark:text-gn-foreground-dark focus:border-gn-accent-blue outline-none"
            />
            <p className="text-[10px] text-gn-foreground-muted dark:text-gray-500 mt-2 text-right">
              Please do not include passwords or sensitive personal data in this field.
            </p>
          </div>

          <div>
            <label htmlFor="issue-email" className="block text-xs font-bold text-gn-foreground-muted dark:text-gn-foreground-muted-dark uppercase mb-2">Your Email (Optional)</label>
            <input 
              id="issue-email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="If you'd like a follow-up..."
              className="w-full bg-gn-surface dark:bg-gn-surface-dark border border-gn-border dark:border-gn-border-dark rounded p-3 text-sm text-gn-foreground dark:text-gn-foreground-dark focus:border-gn-accent-blue outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
               Or email <a href="mailto:support@guynode.com" className="text-gn-foreground dark:text-gray-400 underline hover:text-gn-accent-blue">support@guynode.com</a>
            </div>
            <button 
              type="submit"
              className="bg-guyana-gold hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-yellow-500/10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Submit Report
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
