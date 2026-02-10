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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100/80 dark:bg-slate-900/90">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-6 py-6 shadow-lg text-slate-900 md:px-8 md:py-8 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        {/* Icon + title */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-purple-500/70 bg-slate-50 dark:bg-slate-900">
            {isComplete ? (
              <svg
                className="h-8 w-8 text-purple-600 dark:text-purple-300"
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
                className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400"
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

          <h2 className="text-center text-lg font-semibold text-slate-900 md:text-xl dark:text-slate-50">
            {isComplete ? 'Capture complete' : 'Capturing screenshots'}
          </h2>
          <p className="mt-1 max-w-sm text-center text-xs text-slate-500 md:text-sm dark:text-slate-400">
            {isComplete
              ? 'All screenshots have been saved to the Excel report.'
              : 'Please wait while the tool captures and adds screenshots to the Excel report.'}
          </p>
        </div>

        {/* Current file */}
        <div className="mb-4">
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            {isComplete ? 'Last processed file' : 'Currently processing'}
          </p>
          <div className="truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {currentFile || 'Initializing...'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-3 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            <div
              className="h-full bg-purple-600 transition-all duration-500 ease-out dark:bg-purple-500"
              style={{ width: `${Math.min(displayProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-2 flex items-center justify-between text-xs md:text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
              <svg
                className="h-4 w-4 text-purple-600 dark:text-purple-400"
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
              <span className="font-mono text-slate-800 dark:text-slate-200">
                <span
                  className={
                    isComplete
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-slate-900 dark:text-slate-50'
                  }
                >
                  {current}
                </span>
                <span className="mx-1 text-slate-400 dark:text-slate-500">/</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {total}
                </span>
              </span>
            </div>

            <div
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                isComplete
                  ? 'border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700/70 dark:bg-purple-900/40 dark:text-purple-200'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {isComplete ? 'Done' : 'Processing'}
            </div>
          </div>

          <div className="font-mono text-lg font-semibold text-slate-900 md:text-xl dark:text-slate-50">
            {Math.round(displayProgress)}%
          </div>
        </div>

        {/* Hint */}
        {!isComplete && (
          <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 md:text-xs dark:text-slate-500">
            <svg
              className="h-4 w-4 text-slate-400 dark:text-slate-500"
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