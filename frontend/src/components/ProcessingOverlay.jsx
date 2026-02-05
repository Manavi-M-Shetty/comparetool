// frontend/src/components/ProcessingOverlay.jsx
import React, { useEffect, useState } from 'react';

export default function ProcessingOverlay({
  isVisible,
  currentFile,
  progress,
  total,
  current,
}) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  if (!isVisible) return null;

  const isComplete = progress >= 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90">
      <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-6 py-6 md:px-8 md:py-8 shadow-lg text-slate-100">
        {/* Icon + title */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full border-4 border-purple-500/60 bg-slate-900">
            {isComplete ? (
              <svg
                className="w-8 h-8 text-purple-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-purple-400 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
          </div>

          <h2 className="text-lg md:text-xl font-semibold text-slate-50 text-center">
            {isComplete ? 'Capture complete' : 'Capturing screenshots'}
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-400 text-center max-w-sm">
            {isComplete
              ? 'All screenshots have been saved to the Excel report.'
              : 'Please wait while the tool captures and adds screenshots to the Excel report.'}
          </p>
        </div>

        {/* Current file */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-400 mb-1">
            {isComplete ? 'Last processed file' : 'Currently processing'}
          </p>
          <div className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 truncate">
            {currentFile || 'Initializing...'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-3 w-full bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(displayProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs md:text-sm mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700">
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-mono text-slate-200">
                <span className={isComplete ? 'text-purple-300' : 'text-slate-50'}>
                  {current}
                </span>
                <span className="mx-1 text-slate-500">/</span>
                <span className="text-slate-400">{total}</span>
              </span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                isComplete
                  ? 'bg-purple-900/40 text-purple-200 border border-purple-700/70'
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}
            >
              {isComplete ? 'Done' : 'Processing'}
            </div>
          </div>

          <div className="text-lg md:text-xl font-mono font-semibold text-slate-50">
            {Math.round(displayProgress)}%
          </div>
        </div>

        {/* Hint */}
        {!isComplete && (
          <p className="mt-3 text-[11px] md:text-xs text-slate-500 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Do not close the window until processing is finished.
          </p>
        )}
      </div>
    </div>
  );
}