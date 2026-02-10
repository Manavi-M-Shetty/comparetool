// frontend/src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled error in React tree:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleCopyError = () => {
    const errorText = `Error: ${this.state.error}\n\nStack: ${
      this.state.errorInfo?.componentStack || "N/A"
    }`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(errorText).catch(() => {});
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-6 dark:bg-slate-900">
          <div className="w-full max-w-xl glass-panel p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-200">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3m0 4h.01M4.5 20h15a1.5 1.5 0 001.3-2.25l-7.5-13a1.5 1.5 0 00-2.6 0l-7.5 13A1.5 1.5 0 004.5 20z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-50">
                  Something went wrong
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  The application encountered an unexpected error and
                  couldn't continue.
                </p>
              </div>
            </div>

            {/* Error details */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700 uppercase tracking-wide dark:text-slate-300">
                  Error details
                </span>
                <button
                  type="button"
                  onClick={this.handleCopyError}
                  className="btn-secondary px-2.5 py-1 text-xs"
                  title="Copy error details"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline ml-1">Copy</span>
                </button>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 max-h-32 overflow-auto p-3 dark:border-slate-700 dark:bg-slate-900">
                <pre className="text-xs font-mono text-red-700 whitespace-pre-wrap break-words dark:text-red-300">
                  {String(this.state.error)}
                </pre>
              </div>
            </div>

            {/* Suggestions */}
            <div className="mb-6">
              <p className="text-xs font-medium text-slate-700 uppercase tracking-wide mb-2 dark:text-slate-300">
                What you can try
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600 list-disc list-inside dark:text-slate-300">
                <li>Refresh the page.</li>
                <li>Check your internet connection.</li>
                <li>Make sure the backend server is running.</li>
                <li>Clear your browser cache and try again.</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary flex-1 justify-center"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reload page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-secondary flex-1 justify-center"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go home
              </button>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span>Release Notes Automation Tool</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />
                <span>Error state</span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}