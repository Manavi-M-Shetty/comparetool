// frontend/src/components/StatusBanner.jsx
import React from 'react';
import { useComparison } from '../context/ComparisonContext';

export default function StatusBanner() {
  const { status } = useComparison();

  if (!status || !status.message) return null;

  const type = status.type || 'info';

  let classes = 'backdrop-blur-md border-b text-sm font-medium shadow-lg z-50 transition-all duration-300';
  
  if (type === 'error') {
    classes += ' bg-red-900/60 border-red-500/30 text-red-100';
  } else if (type === 'success') {
    classes += ' bg-emerald-900/60 border-emerald-500/30 text-emerald-100';
  } else {
    // info
    classes += ' bg-blue-900/60 border-blue-500/30 text-blue-100';
  }

  return (
    <div className={classes}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
        {type === 'error' && (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
             </svg>
        )}
        {type === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        )}
        {type === 'info' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        )}
        <span>{status.message}</span>
      </div>
    </div>
  );
}