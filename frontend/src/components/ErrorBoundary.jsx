// frontend/src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled error in React tree:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f0718] text-white">
          <div className="max-w-xl text-center p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-400 mb-6">The application failed to load correctly.</p>
            <div className="text-xs text-left bg-black/40 p-4 rounded-lg border border-red-900/30 text-red-200 font-mono overflow-auto max-h-40">
                {String(this.state.error)}
            </div>
            <div className="mt-6 text-xs text-gray-500">
                Try refreshing the page or checking your backend connection.
            </div>
            <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
            >
                Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}