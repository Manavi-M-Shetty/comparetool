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
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorText = `Error: ${this.state.error}\n\nStack: ${this.state.errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard.writeText(errorText);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0612] text-white overflow-hidden relative">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient orbs */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px]" />
            
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 w-full max-w-lg">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl opacity-50" />
            
            <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-purple-500 to-pink-500" />
              
              {/* Error icon section */}
              <div className="pt-10 pb-6 px-8 text-center">
                <div className="relative inline-block mb-6">
                  {/* Animated rings */}
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-24 h-24 rounded-full border-2 border-red-500/30" />
                  </div>
                  <div className="absolute inset-2 animate-ping" style={{ animationDelay: '0.5s' }}>
                    <div className="w-20 h-20 rounded-full border border-red-500/20" />
                  </div>
                  
                  {/* Main icon */}
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
                    <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                {/* Error title */}
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-300 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-3">
                  Something Went Wrong
                </h1>
                
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                  The application encountered an unexpected error and couldn't continue.
                </p>
              </div>

              {/* Error details section */}
              <div className="px-8 pb-6">
                <div className="relative group">
                  {/* Glow on hover */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative bg-black/40 rounded-xl border border-red-500/20 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Error Details</span>
                      </div>
                      <button
                        onClick={this.handleCopyError}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Copy error"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Error message */}
                    <div className="p-4 max-h-32 overflow-auto scrollbar-thin scrollbar-thumb-red-500/20 scrollbar-track-transparent">
                      <pre className="text-xs font-mono text-red-200/80 whitespace-pre-wrap break-words">
                        {String(this.state.error)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggestions section */}
              <div className="px-8 pb-6">
                <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Suggestions</p>
                <div className="space-y-2">
                  {[
                    { icon: '🔄', text: 'Try refreshing the page' },
                    { icon: '🌐', text: 'Check your internet connection' },
                    { icon: '⚙️', text: 'Ensure the backend server is running' },
                    { icon: '🧹', text: 'Clear your browser cache' },
                  ].map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm text-gray-400">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-8 pb-8">
                <div className="flex gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 group relative overflow-hidden"
                  >
                    {/* Button glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                    
                    <div className="relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all transform hover:-translate-y-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Reload Page</span>
                    </div>
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium text-sm transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Go Home</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 bg-black/20 border-t border-white/5">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Release Notes Automation Tool</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Error State</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Help link */}
            <div className="mt-6 text-center">
              <a 
                href="#" 
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Need help? Check the documentation</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}