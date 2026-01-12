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
    // Could send to logging service here
    console.error("Unhandled error in React tree:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white">
          <div className="max-w-xl text-center">
            <h1 className="text-2xl font-bold mb-2">An error occurred</h1>
            <p className="text-sm text-gray-600 mb-4">The application failed to load. This might be due to a runtime error or an unavailable backend.</p>
            <div className="text-xs text-left bg-gray-50 p-3 rounded border">{String(this.state.error)}</div>
            <p className="text-xs text-gray-500 mt-3">Try refreshing the page or run the dev server using <code>.\\start.bat</code> from the <code>frontend</code> folder to ensure port 3000 is used.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
