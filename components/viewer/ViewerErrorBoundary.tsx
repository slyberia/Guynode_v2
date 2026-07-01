
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render/runtime errors from viewer content (bad asset, malformed
 * GeoJSON, iframe failure) so a single broken dataset degrades to an honest
 * message instead of crashing the whole page.
 */
export class ViewerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Viewer render error:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full text-gn-foreground dark:text-gn-foreground-dark">
          <div className="text-center p-8 bg-gn-surface-muted dark:bg-white/5 rounded border border-gn-border dark:border-white/10 max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gn-foreground-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Preview Could Not Be Displayed</h3>
            <p className="text-sm text-gn-foreground-muted">
              This dataset's preview failed to load. You can still download the asset from the Catalog.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-6 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white rounded transition-colors font-bold"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
