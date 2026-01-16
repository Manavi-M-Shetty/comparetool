import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Global handlers - provide friendly fallback in case of runtime errors
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error || e.message || e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason || e);
});

const rootEl = document.getElementById('root')
if (!rootEl) {
  const msg = 'Root element not found: Check that index.html contains <div id="root"></div>'
  console.error(msg)
  document.body.innerHTML = `<div style="padding:20px;font-family:Arial,sans-serif;">${msg}</div>`
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
}