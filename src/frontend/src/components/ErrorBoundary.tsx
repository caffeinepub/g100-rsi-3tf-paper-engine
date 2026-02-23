import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI Crash:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 dark:bg-red-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-red-900 border-4 border-red-500 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-200 mb-4">
              UI Crash Detected
            </h1>
            <p className="text-red-700 dark:text-red-300 mb-4">
              The application encountered an error. Click the button below to reset storage and reload.
            </p>
            <pre className="bg-red-100 dark:bg-red-800 p-4 rounded text-xs overflow-auto mb-4 text-red-900 dark:text-red-100">
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded"
            >
              RESET STORAGE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
